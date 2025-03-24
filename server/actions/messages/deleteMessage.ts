import { serverSupabaseClient } from '#supabase/server'
import type { DeleteMessageDTO } from '~/shared/types/MessageDTOs'

export const deleteMessage = async (
    event: any,
    dto: DeleteMessageDTO,
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
        .delete()
        .match({ id: dto.id })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
