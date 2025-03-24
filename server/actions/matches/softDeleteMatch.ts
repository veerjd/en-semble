import { serverSupabaseClient } from '#supabase/server'
import type { SoftDeleteMatchDTO } from '~/shared/types/MatchDTOs'

export const softDeleteMatch = async (
    event: any,
    dto: SoftDeleteMatchDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('matches')
        .update({ deleted_at: dto.deleted_at ?? new Date().toISOString() })
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
