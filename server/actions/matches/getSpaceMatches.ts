import { serverSupabaseClient } from '#supabase/server'
import type { MatchDTO } from '~/shared/types/MatchDTOs'

export const getSpaceMatches = async (
    event: any,
    space_id: string,
): Promise<MatchDTO[]> => {
    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('matches')
        .select(
            `
        id,
        status,
        created_at,
        space:spaces (id, name, description),
        user1:user1_id (
            id,
            username,
            bio,
            interest:interests (id, name),
            space:spaces (id, name, description),
            last_active,
            created_at
        ),
        user2:user2_id (
            id,
            username,
            bio,
            interest:interests (id, name),
            space:spaces (id, name, description),
            last_active,
            created_at
        )
    `,
        )
        .eq('space.id', space_id)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transform data to DTOs
    const matches: MatchDTO[] = data.map((match: any) => ({
        id: match.id,
        user1: {
            id: match.user1.id,
            username: match.user1.username,
            bio: match.user1.bio,
            interests: match.user1.interests,
            space: match.user1.space,
            created_at: match.user1.created_at,
            last_active: match.user1.last_active,
        },
        user2: {
            id: match.user2.id,
            username: match.user2.username,
            bio: match.user2.bio,
            interests: match.user2.interests,
            space: match.user2.space,
            created_at: match.user2.created_at,
            last_active: match.user2.last_active,
        },
        status: match.status,
        createdAt: match.created_at,
    }))

    return matches
}
