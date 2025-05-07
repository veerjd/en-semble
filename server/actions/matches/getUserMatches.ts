import { serverSupabaseClient } from '#supabase/server'
import type { MatchDTO } from '~/shared/types/MatchDTOs'

export const getUserMatches = async (
    event: any,
    userId: string,
): Promise<MatchDTO[]> => {
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('matches')
        .select(
            `
        id,
        status_id,
        created_at,
        user1:user1_id (
            id,
            username,
            bio,
            interests (id, slug, category:interest_category_id (id, slug)),
            space:spaces (id, name, description),
            last_active,
            created_at
        ),
        user2:user2_id (
            id,
            username,
            bio,
            interests (id, slug, category:interest_category_id (id, slug)),
            space:spaces (id, name, description),
            last_active,
            created_at
        )
    `,
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transform data to DTOs
    const matches: MatchDTO[] = data.map((match: any) => ({
        id: match.id,
        user1: match.user1,
        user2: match.user2,
        status_id: match.status_id,
        created_at: match.created_at,
    }))

    return matches
}
