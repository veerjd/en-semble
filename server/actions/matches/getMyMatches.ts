import type { H3Event } from 'h3'
import type { MatchDTO } from '~~/shared/types/api'
import type { MatchRow } from '~~/server/utils/mappers'

/** All of the caller's matches, newest first, with unread counts. */
export const getMyMatches = async (event: H3Event): Promise<MatchDTO[]> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data, error } = await db
        .from('matches')
        .select(MATCH_SELECT)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error
    const rows = data as unknown as MatchRow[]

    const chatIds = rows
        .map((r) => (Array.isArray(r.chat) ? r.chat[0]?.id : r.chat?.id))
        .filter((id): id is string => Boolean(id))

    const unreadByChat = new Map<string, number>()
    if (chatIds.length) {
        const { data: unread, error: unreadError } = await db
            .from('chat_messages')
            .select('chat_id')
            .in('chat_id', chatIds)
            .neq('user_id', user.id)
            .is('read_at', null)
            .is('deleted_at', null)
        if (unreadError) throw unreadError
        for (const row of unread) {
            unreadByChat.set(row.chat_id, (unreadByChat.get(row.chat_id) ?? 0) + 1)
        }
    }

    return rows.map((row) => {
        const chatId = Array.isArray(row.chat) ? row.chat[0]?.id : row.chat?.id
        return toMatchDTO(row, user.id, chatId ? (unreadByChat.get(chatId) ?? 0) : 0)
    })
}

/** One match by id, mapped from the given viewer's perspective. */
export const getMatchById = async (
    event: H3Event,
    matchId: string,
    viewerId: string
): Promise<MatchDTO> => {
    const db = useDb(event)

    const { data, error } = await db
        .from('matches')
        .select(MATCH_SELECT)
        .eq('id', matchId)
        .single()

    if (error) throw error
    return toMatchDTO(data as unknown as MatchRow, viewerId)
}
