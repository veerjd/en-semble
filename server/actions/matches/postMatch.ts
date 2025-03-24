import { serverSupabaseClient } from '#supabase/server'
import type { MatchDTO, PostMatchDTO } from '~/shared/types/MatchDTOs'
import { getOneMatch } from './getOneMatch'

export const postMatch = async (
    event: any,
    dto: PostMatchDTO,
): Promise<MatchDTO> => {
    if (!dto.user1_id || !dto.user2_id) {
        throw createError({
            statusCode: 400,
            message: 'Both user IDs are required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    // Ensure user1_id < user2_id as per database constraint
    let user1_id = dto.user1_id
    let user2_id = dto.user2_id

    if (user1_id > user2_id) {
        user1_id = dto.user2_id
        user2_id = dto.user1_id
    }

    // Check if match already exists
    const { data: existingMatch, error: checkError } = await supabase
        .from('matches')
        .select('id')
        .eq('user1_id', user1_id)
        .eq('user2_id', user2_id)
        .maybeSingle()

    if (checkError) {
        throw createError({ statusCode: 500, message: checkError.message })
    }

    if (existingMatch) {
        throw createError({
            statusCode: 409,
            message: 'Match between these users already exists',
        })
    }

    // Create new match
    const { data, error } = await supabase
        .from('matches')
        .insert({
            user1_id: user1_id,
            user2_id: user2_id,
            status: dto.status || 'pending',
        })
        .select('id')
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneMatch(event, data.id)
}
