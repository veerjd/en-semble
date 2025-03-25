import { serverSupabaseClient } from '#supabase/server'
import type { SpaceDTO } from '~/shared/types/SpaceDTOs'

export const getAllSpaces = async (event: any): Promise<SpaceDTO[]> => {
    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase.from('spaces').select('*')

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transform data to DTOs
    const spaces: SpaceDTO[] = data.map((space: any) => ({
        id: space.id,
        name: space.name,
        description: space.description,
        created_at: space.created_at,
    }))

    return spaces
}
