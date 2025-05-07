import { serverSupabaseClient } from '#supabase/server'
import type { PatchChatDTO, ChatDTO } from '~/shared/types/ChatDTOs'
import { getOneChat } from './getOneChat'

export const patchChat = async (
    event: any,
    dto: PatchChatDTO,
): Promise<ChatDTO> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Chat ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const updates: any = {}
    if (dto.user1_id) updates.user1_id = dto.user1_id
    if (dto.user2_id) updates.user2_id = dto.user2_id
    if (dto.match_id) updates.match_id = dto.match_id

    const { error } = await supabase
        .from('chats')
        .update(updates)
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneChat(event, dto.id)
}
