import { serverSupabaseClient } from '#supabase/server'
import type { UserInterestDTO } from '~/shared/types/UserInterestDTOs'

export const replaceUserInterests = async (
    event: any,
    userId: string,
    interestIds: string[],
): Promise<UserInterestDTO[]> => {
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    // First, delete all existing interests for this user
    const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId)

    if (deleteError) {
        throw createError({ statusCode: 500, message: deleteError.message })
    }

    // If no new interests, return empty array
    if (!interestIds.length) {
        return []
    }

    // Create records for insertion
    const interestsToAdd = interestIds.map((interestId) => ({
        user_id: userId,
        interest_id: interestId,
    }))

    const { data, error } = await supabase
        .from('user_interests')
        .insert(interestsToAdd)
        .select()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return data.map((item: any) => ({
        user_id: item.user_id,
        interest_id: item.interest_id,
        created_at: item.created_at,
    }))
}
