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
        chat: {
            id: data.chat.id,
            user1: data.chat.user1,
            user2: data.chat.user2,
            match: data.chat.match,
            created_at: data.chat.created_at,
        },
        user: {
            id: data.user.id,
            username: data.user.username,
            bio: data.user?.bio,
            interests: Array.isArray(data.user?.interests)
                ? data.user.interests.map((interest: any) => ({
                      id: interest.id,
                      slug: interest.slug,
                      category: {
                          id: interest.category.id,
                          slug: interest.category.slug,
                          created_at: interest.category.created_at,
                      },
                      created_at: interest.created_at,
                  }))
                : data.user?.interests
                  ? [
                        {
                            id: data.user.interests.id,
                            slug: data.user.interests.slug,
                            category: {
                                id: data.user.interests.category.id,
                                slug: data.user.interests.category.slug,
                                created_at:
                                    data.user.interests.category.created_at,
                            },
                            created_at: data.user.interests.created_at,
                        },
                    ]
                  : [],
            space: {
                id: data.user.id,
                name: data.user.name,
                description: data.user?.description,
                created_at: data.user?.created_at,
            },
            created_at: data.user.created_at,
            last_active: data.user.last_active,
        },
        content: data.content,
        read: data.read,
        created_at: data.created_at,
    }
}
