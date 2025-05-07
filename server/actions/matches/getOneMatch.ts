import { serverSupabaseClient } from '#supabase/server'
import type { MatchDTO } from '~/shared/types/MatchDTOs'

export const getOneMatch = async (
    event: any,
    matchId: string,
): Promise<MatchDTO> => {
    if (!matchId) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
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
        .eq('id', matchId)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'Match not found' })
    }

    return {
        id: data.id,
        user1: data.user1,
        user2: data.user2,
        status_id: data.status_id,
        created_at: data.created_at,
    }
}
