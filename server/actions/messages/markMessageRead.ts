import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO } from '~/shared/types/MessageDTOs'
import { getOneMessage } from './getOneMessage'

export const markMessageRead = async (
    event: any,
    id: string,
): Promise<MessageDTO> => {
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneMessage(event, id)
}
