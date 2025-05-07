import { serverSupabaseClient } from '#supabase/server'
import type { PatchMatchDTO, MatchDTO } from '~/shared/types/MatchDTOs'
import { getOneMatch } from './getOneMatch'

export const patchMatch = async (
    event: any,
    dto: PatchMatchDTO,
): Promise<MatchDTO> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { error } = await supabase
        .from('matches')
        .update({
            user1_id: dto.user1_id,
            user2_id: dto.user2_id,
            status_id: dto.status_id,
        })
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneMatch(event, dto.id)
}
