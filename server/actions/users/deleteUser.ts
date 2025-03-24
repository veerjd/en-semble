import { serverSupabaseClient } from '#supabase/server'
import type { DeleteUserDTO } from '~/shared/types/UserDTOs'

export const deleteUser = async (
    event: any,
    dto: DeleteUserDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    // Delete the permission
    const { error } = await supabase
        .from('users')
        .delete()
        .match({ id: dto.id })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
