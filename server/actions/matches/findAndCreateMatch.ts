import type { H3Event } from 'h3'
import type { MatchDTO } from '~~/shared/types/api'
import { getMatchById } from './getMyMatches'

/**
 * Product-generated matching for the CALLER:
 * candidates = live members of the caller's space, minus anyone the caller
 * already has a match row with (any status — a rejected pair never
 * re-matches, enforced by unique(user1_id, user2_id) too).
 * The candidate sharing the most interests wins; zero overlap never matches
 * (404 no_overlap -> the UI offers suggested interests instead).
 */
export const findAndCreateMatch = async (event: H3Event): Promise<MatchDTO> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data: mine, error: mineError } = await db
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user.id)
    if (mineError) throw mineError
    const myInterestIds = new Set(mine.map((r) => r.interest_id))

    if (myInterestIds.size === 0) apiError(404, 'no_overlap')

    const { data: candidates, error: candidatesError } = await db
        .from('users')
        .select('id, user_interests(interest_id)')
        .eq('space_id', user.space_id)
        .neq('id', user.id)
        .is('deleted_at', null)
    if (candidatesError) throw candidatesError

    if (!candidates.length) apiError(404, 'no_candidates')

    // Blacklist everyone the caller has ever been paired with.
    const { data: priorMatches, error: priorError } = await db
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    if (priorError) throw priorError

    const paired = new Set(
        priorMatches.map((m) =>
            m.user1_id === user.id ? m.user2_id : m.user1_id,
        ),
    )

    let best: { id: string; overlap: number } | null = null
    for (const candidate of candidates) {
        if (paired.has(candidate.id)) continue
        const overlap = candidate.user_interests.filter((ui) =>
            myInterestIds.has(ui.interest_id),
        ).length
        if (overlap > 0 && (!best || overlap > best.overlap)) {
            best = { id: candidate.id, overlap }
        }
    }

    if (!best) {
        const unpaired = candidates.filter((c) => !paired.has(c.id))
        apiError(404, unpaired.length ? 'no_overlap' : 'no_candidates')
    }

    const [user1_id, user2_id] = [user.id, best!.id].sort()

    const { data: inserted, error: insertError } = await db
        .from('matches')
        .insert({
            space_id: user.space_id,
            user1_id: user1_id!,
            user2_id: user2_id!,
        })
        .select('id')
        .single()

    if (insertError) {
        if (insertError.code === '23505') apiError(409, 'match_exists')
        throw insertError
    }

    return getMatchById(event, inserted.id, user.id)
}
