import { serverSupabaseClient } from '#supabase/server'
import type { InterestDTO, PostInterestDTO } from '~/shared/types/InterestDTOs'

export const postInterest = async (
    event: any,
    dto: PostInterestDTO,
): Promise<InterestDTO> => {
    if (!dto.slug) {
        throw createError({
            statusCode: 400,
            message: 'Interest name is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { data, error } = await supabase
        .from('interests')
        .insert({ slug: dto.slug })
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return {
        id: data.id,
        slug: data.slug,
        category: data.category,
        createdAt: data.created_at,
    }
}
