import { serverSupabaseClient } from '#supabase/server'
import type { UserInterestDTO } from '~/shared/types/UserInterestDTOs'

export const getUserInterests = async (
    event: any,
    userId: string,
): Promise<UserInterestDTO[]> => {
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return data.map((item: any) => ({
        user_id: item.user_id,
        interest_id: item.interest_id,
        created_at: item.created_at,
    }))
}
