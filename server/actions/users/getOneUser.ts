import { serverSupabaseClient } from '#supabase/server'
import type { UserDTO } from '~/shared/types/UserDTOs'

export const getOneUser = async (event: any, id: string): Promise<UserDTO> => {
    if (!id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('users')
        .select(
            `
        id,
        username,
        bio,
        interests ( id, slug, category:interest_category_id ( id, slug ) ),
        space:spaces ( id, name, description ),
        last_active,
        created_at
        `,
        )
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'User not found' })
    } else {
        return {
            id: data.id,
            username: data.username,
            bio: data.bio,
            interests: data.interests,
            space: data.space,
            created_at: data.created_at,
            last_active: data.last_active,
        }
    }
}
