import type { H3Event } from 'h3'
import type { MessageDTO } from '~~/shared/types/api'
import type { Tables } from '~~/shared/types/database.types'

const PAGE_SIZE = 50

export const toMessageDTO = (row: Tables<'chat_messages'>): MessageDTO => ({
    id: row.id,
    chatId: row.chat_id,
    userId: row.user_id,
    content: row.content,
    readAt: row.read_at,
    createdAt: row.created_at,
})

/**
 * Messages for a chat, oldest first. Pass ?before=<ISO timestamp> to page
 * backwards through history.
 */
export const getChatMessages = async (
    event: H3Event,
    chatId: string,
    before?: string
): Promise<MessageDTO[]> => {
    await requireChatParticipant(event, chatId)
    const db = useDb(event)

    let query = db
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) throw error

    return data.reverse().map(toMessageDTO)
}
