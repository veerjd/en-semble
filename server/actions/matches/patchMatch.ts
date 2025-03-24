import { serverSupabaseClient } from '#supabase/server'
import type { MatchDTO, PatchMatchDTO } from '~/shared/types/MatchDTOs'
import { getOneMatch } from './getOneMatch'

export const patchMatch = async (
    event: any,
    dto: PatchMatchDTO,
): Promise<MatchDTO> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    const updates: Record<string, any> = {}
    if (dto.status) updates.status = dto.status

    // Optional updates for user IDs - usually not changed after creation
    if (dto.user1_id) updates.user1_id = dto.user1_id
    if (dto.user2_id) updates.user2_id = dto.user2_id

    // Ensure user1_id < user2_id as per database constraint
    if (updates.user1_id && updates.user2_id) {
        const user1 = updates.user1_id
        const user2 = updates.user2_id

        if (user1 > user2) {
            updates.user1_id = user2
            updates.user2_id = user1
        }
    }

    const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneMatch(event, dto.id)
}
