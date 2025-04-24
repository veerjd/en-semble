import { serverSupabaseClient } from '#supabase/server'
import type { UserDTO } from '~/shared/types/UserDTOs'

export const getAllUsers = async (event: any): Promise<UserDTO[]> => {
    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase.from('users').select(
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

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transformation des données en DTOs
    const users: UserDTO[] = data.map((user: any) => ({
        id: user.id,
        username: user.username,
        bio: user.bio,
        interests: user.interests,
        space: user.space,
        last_active: user.last_active,
        created_at: user.created_at,
    }))

    return users
}
