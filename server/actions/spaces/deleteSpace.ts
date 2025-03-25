import { serverSupabaseClient } from '#supabase/server'
import type { DeleteSpaceDTO } from '~/shared/types/SpaceDTOs'

export const deleteSpace = async (
    event: any,
    dto: DeleteSpaceDTO,
): Promise<void> => {
    if (!dto.id) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
        .from('spaces')
        .delete()
        .match({ id: dto.id })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }
}
