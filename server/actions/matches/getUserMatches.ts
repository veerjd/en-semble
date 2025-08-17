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
        ),
        chats (
            id
        )
    `,
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Helper function to map status_id to status name
    const getStatusName = (statusId: number): string => {
        switch (statusId) {
            case 1:
                return 'pending'
            case 2:
                return 'accepted'
            case 3:
                return 'rejected'
            case 4:
                return 'expired'
            default:
                return 'unknown'
        }
    }

    // Transform data to DTOs
    const matches: MatchDTO[] = data.map((match: any) => ({
        id: match.id,
        user1: match.user1,
        user2: match.user2,
        status_id: match.status_id,
        status: getStatusName(match.status_id),
        created_at: match.created_at,
        chat: match.chats?.[0] || null,
    }))

    return matches
}
