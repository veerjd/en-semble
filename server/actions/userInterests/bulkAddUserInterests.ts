import { serverSupabaseClient } from '#supabase/server'
import type { UserInterestDTO } from '~/shared/types/UserInterestDTOs'

export const bulkAddUserInterests = async (
    event: any,
    userId: string,
    interestIds: string[],
): Promise<UserInterestDTO[]> => {
    if (!userId || !interestIds.length) {
        throw createError({
            statusCode: 400,
            message: 'User ID and at least one Interest ID are required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    // Create records for insertion
    const interestsToAdd = interestIds.map((interestId) => ({
        user_id: userId,
        interest_id: interestId,
    }))

    const { data, error } = await supabase
        .from('user_interests')
        .upsert(interestsToAdd, {
            onConflict: 'user_id,interest_id',
            ignoreDuplicates: true,
        })
        .select()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return data.map((item) => ({
        user_id: item.user_id,
        interest_id: item.interest_id,
        created_at: item.created_at,
    }))
}
