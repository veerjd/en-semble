import { serverSupabaseClient } from '#supabase/server'
import type { SoftDeleteUserDTO } from '~/shared/types/UserDTOs'

export const softDeleteUser = async (
    event: any,
    dto: SoftDeleteUserDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('users')
        .update({ deleted_at: dto.deleted_at ?? new Date().toISOString() }) // Define deleted_at if absent
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
