import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { SpaceDTO } from '~/shared/types/SpaceDTOs'

export const getUserSpaces = async (event: any): Promise<SpaceDTO[]> => {
    const supabase = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'User not authenticated',
        })
    }

    // Get the user's space by joining users and spaces tables
    const { data, error } = await supabase
        .from('users')
        .select(`
            space:spaces (
                id,
                name,
                description,
                created_at
            )
        `)
        .eq('id', user.id)
        .single()

    if (error) {
        throw createError({ 
            statusCode: 500, 
            message: `Failed to get user space: ${error.message}` 
        })
    }

    if (!data?.space) {
        // User has no space assigned, return empty array
        return []
    }

    // Return the single space as an array
    return [data.space as SpaceDTO]
}