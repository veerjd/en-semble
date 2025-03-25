import { serverSupabaseClient } from '#supabase/server'
import type { SoftDeleteSpaceDTO } from '~/shared/types/SpaceDTOs'

export const softDeleteSpace = async (
    event: any,
    dto: SoftDeleteSpaceDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('spaces')
        .update({ deleted_at: dto.deleted_at ?? new Date().toISOString() })
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
