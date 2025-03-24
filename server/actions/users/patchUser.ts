import { serverSupabaseClient } from '#supabase/server'
import type { PatchUserDTO, UserDTO } from '~/shared/types/UserDTOs'
import { getOneUser } from './getOneUser'

export const patchUser = async (
    event: any,
    dto: PatchUserDTO,
): Promise<UserDTO> => {
    const supabase = await serverSupabaseClient(event)

    if (!dto.id)
        throw createError({
            statusCode: 400,
            message: 'User ID is required',
        })

    // Update user details if present
    if (dto.username || dto.bio || dto.space_id || dto.interests) {
        const updates: Record<string, any> = {}
        if (dto.username) updates.username = dto.username
        if (dto.bio) updates.bio = dto.bio
        if (dto.space_id) updates.space_id = dto.space_id
        if (dto.interests) updates.interests = dto.interests

        const { error: userError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', dto.id)

        if (userError) {
            throw createError({
                statusCode: 500,
                message: userError.message,
            })
        }
    }

    return await getOneUser(event, dto.id)
}
