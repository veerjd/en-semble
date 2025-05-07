import { serverSupabaseClient } from '#supabase/server'
import type { ChatDTO } from '~/shared/types/ChatDTOs'

export const getOneChat = async (
    event: any,
    chatId: string,
): Promise<ChatDTO> => {
    if (!chatId) {
        throw createError({ statusCode: 400, message: 'Chat ID is required' })
    }

    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .maybeSingle()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (!data) {
        throw createError({ statusCode: 404, message: 'Chat not found' })
    }

    return {
        id: data.id,
        user1: data.user1,
        user2: data.user2,
        match: data.match,
        created_at: data.created_at,
    }
}
