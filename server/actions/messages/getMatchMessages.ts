import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO } from '~/shared/types/MessageDTOs'

export const getMatchMessages = async (
    event: any,
    matchId: string,
): Promise<MessageDTO[]> => {
    if (!matchId) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('messages')
        .select(
            `
            id,
            content,
            read,
            created_at,
            match:match_id (
                id,
                status,
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
            ),
            user:user_id (
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
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transform data to DTOs
    const messages: MessageDTO[] = data.map((message: any) => ({
        id: message.id,
        match: {
            id: message.match.id,
            user1: message.match.user1,
            user2: message.match.user2,
            status: message.match.status,
            createdAt: message.match.created_at,
        },
        user: message.user,
        content: message.content,
        read: message.read,
        createdAt: message.created_at,
    }))

    return messages
}
