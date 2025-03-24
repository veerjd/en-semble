import { serverSupabaseClient } from '#supabase/server'
import type { DeleteMatchDTO } from '~/shared/types/MatchDTOs'

export const deleteMatch = async (
    event: any,
    dto: DeleteMatchDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('matches')
        .delete()
        .match({ id: dto.id })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
