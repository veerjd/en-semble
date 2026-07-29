import type { H3Event } from 'h3'
import type { ChatDTO } from '~~/shared/types/api'

export const getChat = async (
    event: H3Event,
    chatId: string
): Promise<ChatDTO> => {
    const { user, chat, match } = await requireChatParticipant(event, chatId)
    const db = useDb(event)

    const otherUserId =
        match.user1_id === user.id ? match.user2_id : match.user1_id

    const { data: other, error } = await db
        .from('users')
        .select(
            'id, username, bio, user_interests(interest:interests(id, slug, label))'
        )
        .eq('id', otherUserId)
        .single()

    if (error) throw error

    return {
        id: chat.id,
        matchId: match.id,
        otherUser: toMatchUser(other),
    }
}
