import { serverSupabaseClient } from '#supabase/server'
import type { SpaceDTO } from '~/shared/types/SpaceDTOs'

export const getOneSpace = async (
    event: any,
    id: string,
): Promise<SpaceDTO> => {
    if (!id) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'Space not found' })
    } else {
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            created_at: data.created_at,
        }
    }
}
