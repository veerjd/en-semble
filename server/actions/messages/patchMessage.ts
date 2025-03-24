import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO, PatchMessageDTO } from '~/shared/types/MessageDTOs'
import { getOneMessage } from './getOneMessage'

export const patchMessage = async (
    event: any,
    dto: PatchMessageDTO,
): Promise<MessageDTO> => {
    if (!dto.id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const updates: Record<string, any> = {}
    if (dto.content !== undefined) updates.content = dto.content
    if (dto.read !== undefined) updates.read = dto.read
    if (dto.match_id) updates.match_id = dto.match_id
    if (dto.user_id) updates.user_id = dto.user_id

    const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneMessage(event, dto.id)
}
