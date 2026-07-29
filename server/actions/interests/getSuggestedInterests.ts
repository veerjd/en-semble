import type { H3Event } from 'h3'
import type { InterestDTO } from '~~/shared/types/api'

/**
 * Interests held by other (live) members of the caller's space that the
 * caller does not have yet, most-held first. Feeds the "no overlap — add
 * one of these to get matched" flow.
 */
export const getSuggestedInterests = async (
    event: H3Event,
    limit = 20
): Promise<InterestDTO[]> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data: members, error: membersError } = await db
        .from('users')
        .select('id')
        .eq('space_id', user.space_id)
        .neq('id', user.id)
        .is('deleted_at', null)

    if (membersError) throw membersError
    if (!members.length) return []

    const { data: theirInterests, error: interestsError } = await db
        .from('user_interests')
        .select('interest_id, interest:interests(id, slug, label)')
        .in(
            'user_id',
            members.map((m) => m.id)
        )

    if (interestsError) throw interestsError

    const { data: mine, error: mineError } = await db
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user.id)

    if (mineError) throw mineError
    const myIds = new Set(mine.map((r) => r.interest_id))

    const counts = new Map<string, { interest: InterestDTO; count: number }>()
    for (const row of theirInterests) {
        if (!row.interest || myIds.has(row.interest_id)) continue
        const entry = counts.get(row.interest_id)
        if (entry) entry.count += 1
        else counts.set(row.interest_id, { interest: row.interest, count: 1 })
    }

    return [...counts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((e) => e.interest)
}
