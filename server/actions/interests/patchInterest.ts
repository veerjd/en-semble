import { serverSupabaseClient } from '#supabase/server'
import type { InterestDTO, PatchInterestDTO } from '~/shared/types/InterestDTOs'
import { getOneInterest } from './getOneInterest'

export const patchInterest = async (
    event: any,
    id: string,
    dto: PatchInterestDTO,
): Promise<InterestDTO> => {
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('interests')
        .update({ slug: dto.slug, category_id: dto.category_id })
        .eq('id', id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneInterest(event, id)
}
