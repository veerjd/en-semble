import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO } from '~~/shared/types/MessageDTOs'

export const getUserMessages = async (
    event: any,
    userId: string,
): Promise<MessageDTO[]> => {
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    // First get matches involving this user
    const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (matchError) {
        throw createError({ statusCode: 500, message: matchError.message })
    }

    if (!matchData || matchData.length === 0) {
        return [] // No matches, so no messages
    }

    const matchIds = matchData.map((match) => match.id)

    // Now get messages for these matches
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
        .in('match_id', matchIds)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Transform data to DTOs
    const messages: MessageDTO[] = data.map((message: any) => ({
        id: message.id,
        chat: {
            id: message.chat.id,
            user1: message.chat.user1,
            user2: message.chat.user2,
            status: message.chat.status,
            match: message.chat.match,
            created_at: message.chat.created_at,
        },
        user: {
            id: message.user.id,
            username: message.user.username,
            bio: message.user?.bio,
            interests: Array.isArray(message.user?.interests)
                ? message.user.interests.map((interest: any) => ({
                      id: interest.id,
                      slug: interest.slug,
                      category: {
                          id: interest.category.id,
                          slug: interest.category.slug,
                          created_at: interest.category.created_at,
                      },
                      created_at: interest.created_at,
                  }))
                : message.user?.interests
                  ? [
                        {
                            id: message.user.interests.id,
                            slug: message.user.interests.slug,
                            category: {
                                id: message.user.interests.category.id,
                                slug: message.user.interests.category.slug,
                                created_at:
                                    message.user.interests.category.created_at,
                            },
                            created_at: message.user.interests.created_at,
                        },
                    ]
                  : [],
            space: {
                id: message.user.id,
                name: message.user.name,
                description: message.user?.description,
                created_at: message.user?.created_at,
            },
            created_at: message.user.created_at,
            last_active: message.user.last_active,
        },
        content: message.content,
        read: message.read,
        created_at: message.created_at,
    }))

    return messages
}
