import { serverSupabaseClient } from '#supabase/server'
import type { InterestDTO } from '~/shared/types/InterestDTOs'

export const getOneInterest = async (
    event: any,
    id: string,
): Promise<InterestDTO> => {
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('interests')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'Interest not found' })
    } else {
        return {
            id: data.id,
            name: data.name,
            createdAt: data.created_at,
        }
    }
}
