import { serverSupabaseClient } from '#supabase/server'
import type { SoftDeleteChatDTO } from '~/shared/types/ChatDTOs'

export const softDeleteChat = async (
    event: any,
    dto: SoftDeleteChatDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Chat ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { error } = await supabase
        .from('chats')
        .update({ deleted_at: dto.deleted_at || new Date().toISOString() })
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
