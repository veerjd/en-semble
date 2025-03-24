import { serverSupabaseClient } from '#supabase/server'
import type { SoftDeleteMessageDTO } from '~/shared/types/MessageDTOs'

export const softDeleteMessage = async (
    event: any,
    dto: SoftDeleteMessageDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('messages')
        .update({ deleted_at: dto.deleted_at ?? new Date().toISOString() })
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
