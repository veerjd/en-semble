import { serverSupabaseClient } from '#supabase/server'
import type { InterestDTO } from '~/shared/types/InterestDTOs'

export const getAllInterests = async (event: any): Promise<InterestDTO[]> => {
    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase.from('interests').select('*')

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transform data to DTOs
    const interests: InterestDTO[] = data.map((interest: any) => ({
        id: interest.id,
        slug: interest.slug,
        category: interest.category,
        createdAt: interest.created_at,
    }))

    return interests
}
