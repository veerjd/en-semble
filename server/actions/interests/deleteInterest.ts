import { serverSupabaseClient } from '#supabase/server'
import type { DeleteInterestDTO } from '~/shared/types/InterestDTOs'

export const deleteInterest = async (
    event: any,
    dto: DeleteInterestDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('interests')
        .delete()
        .match({ id: dto.id })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
