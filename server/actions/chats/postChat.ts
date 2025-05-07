import { serverSupabaseClient } from '#supabase/server'
import type { PostChatDTO, ChatDTO } from '~/shared/types/ChatDTOs'
import { getOneChat } from './getOneChat'

export const postChat = async (
    event: any,
    dto: PostChatDTO,
): Promise<ChatDTO> => {
    if (!dto.user1_id || !dto.user2_id || !dto.match_id) {
        throw createError({
            statusCode: 400,
            message: 'user1_id, user2_id et match_id requis',
        })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('chats')
        .insert({
            user1_id: dto.user1_id,
            user2_id: dto.user2_id,
            match_id: dto.match_id,
        })
        .select('id')
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneChat(event, data.id)
}
