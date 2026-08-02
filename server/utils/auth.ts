import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import type { Tables } from '~~/shared/types/database.types'

export type SessionUser = Tables<'users'>

/**
 * Resolve the authenticated caller's profile row (cached per request).
 * 401 when there is no session; 403 when the auth user has no (live)
 * profile row.
 */
export const requireUser = async (event: H3Event): Promise<SessionUser> => {
    if (event.context._sessionUser) {
        return event.context._sessionUser as SessionUser
    }

    let authUserId: string | undefined
    try {
        const authUser = await serverSupabaseUser(event)
        authUserId = authUser?.id
    } catch {
        authUserId = undefined
    }
    if (!authUserId) apiError(401, 'unauthenticated')

    const db = useDb(event)
    const { data: user, error } = await db
        .from('users')
        .select('*')
        .eq('id', authUserId!)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) throw error
    if (!user) apiError(403, 'profile_missing')

    event.context._sessionUser = user
    return user!
}

/**
 * 403 unless the caller belongs to the given space (by id or slug).
 */
export const requireSpaceMember = async (
    event: H3Event,
    spaceIdOrSlug: string,
): Promise<SessionUser> => {
    const user = await requireUser(event)
    if (user.space_id === spaceIdOrSlug) return user

    const db = useDb(event)
    const { data: space, error } = await db
        .from('spaces')
        .select('id')
        .eq('slug', spaceIdOrSlug)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) throw error
    if (!space || user.space_id !== space.id) apiError(403, 'not_space_member')
    return user
}

/**
 * Load a match and assert the caller is one of its two participants.
 */
export const requireMatchParticipant = async (
    event: H3Event,
    matchId: string,
) => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data: match, error } = await db
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) throw error
    if (!match) apiError(404, 'match_not_found')
    if (match!.user1_id !== user.id && match!.user2_id !== user.id) {
        apiError(403, 'not_match_participant')
    }
    return { user, match: match! }
}

/**
 * Load a chat (with its match) and assert the caller participates in it.
 */
export const requireChatParticipant = async (
    event: H3Event,
    chatId: string,
) => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data: chat, error } = await db
        .from('chats')
        .select('*, match:matches!inner(*)')
        .eq('id', chatId)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) throw error
    if (!chat) apiError(404, 'chat_not_found')
    const match = chat!.match
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
        apiError(403, 'not_chat_participant')
    }
    return { user, chat: chat!, match }
}
