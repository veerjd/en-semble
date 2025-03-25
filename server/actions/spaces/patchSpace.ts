import { serverSupabaseClient } from '#supabase/server'
import type { PatchSpaceDTO, SpaceDTO } from '~/shared/types/SpaceDTOs'
import { getOneSpace } from './getOneSpace'

export const patchSpace = async (
    event: any,
    dto: PatchSpaceDTO,
): Promise<SpaceDTO> => {
    if (!dto.id) {
        throw createError({
            statusCode: 400,
            message: 'Space ID is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const updates: Record<string, any> = {}
    if (dto.name) updates.name = dto.name
    if (dto.description !== undefined) updates.description = dto.description

    const { error } = await supabase
        .from('spaces')
        .update(updates)
        .eq('id', dto.id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return await getOneSpace(event, dto.id)
}
