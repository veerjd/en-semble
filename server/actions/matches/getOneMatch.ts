import { serverSupabaseClient } from '#supabase/server'
import type { MatchDTO } from '~/shared/types/MatchDTOs'

export const getOneMatch = async (
    event: any,
    id: string,
): Promise<MatchDTO> => {
    if (!id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('matches')
        .select(
            `
        id,
        status,
        created_at,
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
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'Match not found' })
    }

    return {
        id: data.id,
        user1: {
            id: data.user1.id,
            username: data.user1.username,
            bio: data.user1.bio,
            interests: data.user1.interests,
            space: data.user1.space,
            created_at: data.user1.created_at,
            last_active: data.user1.last_active,
        },
        user2: {
            id: data.user2.id,
            username: data.user2.username,
            bio: data.user2.bio,
            interests: data.user2.interests,
            space: data.user2.space,
            created_at: data.user2.created_at,
            last_active: data.user2.last_active,
        },
        status: data.status,
        createdAt: data.created_at,
    }
}
