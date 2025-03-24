import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO } from '~/shared/types/MessageDTOs'

export const getOneMessage = async (
    event: any,
    id: string,
): Promise<MessageDTO> => {
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
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
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'Message not found' })
    }

    return {
        id: data.id,
        match: {
            id: data.match.id,
            user1: data.match.user1,
            user2: data.match.user2,
            status: data.match.status,
            createdAt: data.match.created_at,
        },
        user: data.user,
        content: data.content,
        read: data.read,
        createdAt: data.created_at,
    }
}
