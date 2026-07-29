import type { H3Event } from 'h3'
import type { PostMessageInput } from '~~/shared/schemas/message'
import type { MessageDTO } from '~~/shared/types/api'
import { toMessageDTO } from './getChatMessages'

/** Send a message as the authenticated caller (sender is never client-supplied). */
export const postMessage = async (
    event: H3Event,
    chatId: string,
    input: PostMessageInput,
): Promise<MessageDTO> => {
    const { user } = await requireChatParticipant(event, chatId)
    const db = useDb(event)

    const { data, error } = await db
        .from('chat_messages')
        .insert({
            chat_id: chatId,
            user_id: user.id,
            content: input.content,
        })
        .select('*')
        .single()

    if (error) throw error
    return toMessageDTO(data)
}
