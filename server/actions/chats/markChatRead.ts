import type { H3Event } from 'h3'

/** Mark the other participant's messages in this chat as read. */
export const markChatRead = async (event: H3Event, chatId: string) => {
    const { user } = await requireChatParticipant(event, chatId)
    const db = useDb(event)

    const { error } = await db
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('user_id', user.id)
        .is('read_at', null)

    if (error) throw error
    return { ok: true as const }
}
