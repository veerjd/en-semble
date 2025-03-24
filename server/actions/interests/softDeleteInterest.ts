import { serverSupabaseClient } from '#supabase/server'
import type { SoftDeleteInterestDTO } from '~/shared/types/InterestDTOs'

export const softDeleteInterest = async (
    event: any,
    dto: SoftDeleteInterestDTO,
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
        .update({ deleted_at: dto.deleted_at ?? new Date().toISOString() })
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
