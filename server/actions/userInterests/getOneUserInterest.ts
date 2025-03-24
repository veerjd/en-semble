import { serverSupabaseClient } from '#supabase/server'
import type { UserInterestDTO } from '~/shared/types/UserInterestDTOs'

export const getOneUserInterest = async (
    event: any,
    userId: string,
    interestId: string,
): Promise<UserInterestDTO | null> => {
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    if (!interestId) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .match({ user_id: userId, interest_id: interestId })
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        return null
    }

    return {
        user_id: data.user_id,
        interest_id: data.interest_id,
        created_at: data.created_at,
    }
}
