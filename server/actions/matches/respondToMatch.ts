import type { H3Event } from 'h3'
import type { MatchDTO, MatchResponse } from '~~/shared/types/api'
import { getMatchById } from './getMyMatches'

/**
 * Accept or reject a match as the authenticated caller. Delegates the
 * response transition + conditional chat creation to the respond_to_match
 * RPC so mutual accept is atomic and race-safe.
 */
export const respondToMatch = async (
    event: H3Event,
    matchId: string,
    response: Extract<MatchResponse, 'accepted' | 'rejected'>
): Promise<MatchDTO> => {
    const { user } = await requireMatchParticipant(event, matchId)
    const db = useDb(event)

    const { error } = await db.rpc('respond_to_match', {
        p_match_id: matchId,
        p_user_id: user.id,
        p_response: response,
    })

    if (error) {
        if (error.message.includes('already_responded')) {
            apiError(409, 'already_responded')
        }
        if (error.message.includes('match_not_found')) {
            apiError(404, 'match_not_found')
        }
        throw error
    }

    return getMatchById(event, matchId, user.id)
}
