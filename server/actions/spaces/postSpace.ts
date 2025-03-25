import { serverSupabaseClient } from '#supabase/server'
import type { PostSpaceDTO, SpaceDTO } from '~/shared/types/SpaceDTOs'

export const postSpace = async (
    event: any,
    newSpace: PostSpaceDTO,
): Promise<SpaceDTO> => {
    if (!newSpace.name) {
        throw createError({
            statusCode: 400,
            message: 'Space name is required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    const { data, error } = await supabase
        .from('spaces')
        .insert({
            name: newSpace.name,
            description: newSpace.description,
        })
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
    }
}
