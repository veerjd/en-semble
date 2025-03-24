import { serverSupabaseClient } from '#supabase/server'
import type { DeleteUserInterestDTO } from '~/shared/types/UserInterestDTOs'

export const deleteUserInterest = async (
    event: any,
    dto: DeleteUserInterestDTO,
): Promise<void> => {
    if (!dto.user_id || !dto.interest_id) {
        throw createError({
            statusCode: 400,
            message: 'User ID and Interest ID are required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('user_interests')
        .delete()
        .match({ user_id: dto.user_id, interest_id: dto.interest_id })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
