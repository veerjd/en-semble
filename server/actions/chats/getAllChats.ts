import { serverSupabaseClient } from '#supabase/server'
import type { ChatDTO } from '~/shared/types/ChatDTOs'

export const getAllChats = async (event: any): Promise<ChatDTO[]> => {
    const supabase = await serverSupabaseClient(event)
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return (data || []).map((chat: any) => ({
        id: chat.id,
        user1: chat.user1,
        user2: chat.user2,
        match: chat.match,
        created_at: chat.created_at,
    }))
}
