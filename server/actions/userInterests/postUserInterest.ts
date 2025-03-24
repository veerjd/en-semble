import { serverSupabaseClient } from '#supabase/server'
import type {
    PostUserInterestDTO,
    UserInterestDTO,
} from '~/shared/types/UserInterestDTOs'

export const postUserInterest = async (
    event: any,
    dto: PostUserInterestDTO,
): Promise<UserInterestDTO> => {
    if (!dto.user_id || !dto.interest_id) {
        throw createError({
            statusCode: 400,
            message: 'User ID and Interest ID are required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    // Check if relation already exists
    const { data: existing, error: checkError } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', dto.user_id)
        .eq('interest_id', dto.interest_id)
        .maybeSingle()

    if (checkError) {
        throw createError({ statusCode: 500, message: checkError.message })
    }

    if (existing) {
        return {
            user_id: existing.user_id,
            interest_id: existing.interest_id,
            created_at: existing.created_at,
        }
    }

    // Create new relationship
    const { data, error } = await supabase
        .from('user_interests')
        .insert({
            user_id: dto.user_id,
            interest_id: dto.interest_id,
        })
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return {
        user_id: data.user_id,
        interest_id: data.interest_id,
        created_at: data.created_at,
    }
}
