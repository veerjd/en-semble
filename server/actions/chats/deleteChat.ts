import { serverSupabaseClient } from '#supabase/server'
import type { DeleteChatDTO } from '~/shared/types/ChatDTOs'

export const deleteChat = async (
    event: any,
    dto: DeleteChatDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Chat ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { error } = await supabase.from('chats').delete().eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
