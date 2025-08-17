import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const matchId = getRouterParam(event, 'id')
    if (!matchId) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    try {
        // 1. Update match status to accepted (status_id = 2)
        const { error: matchError } = await supabase
            .from('matches')
            .update({ status_id: 2 })
            .eq('id', matchId)

        if (matchError) {
            throw createError({ statusCode: 500, message: matchError.message })
        }

        // 2. Check if chat already exists for this match
        const { data: existingChat } = await supabase
            .from('chats')
            .select('id')
            .eq('match_id', matchId)
            .maybeSingle()

        if (existingChat) {
            return {
                chatId: existingChat.id,
                message: 'Match accepted, chat already exists',
            }
        }

        // 3. Create a new chat
        const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert({ match_id: matchId })
            .select('id')
            .single()

        if (chatError) {
            throw createError({ statusCode: 500, message: chatError.message })
        }

        return {
            chatId: chatData.id,
            message: 'Match accepted and chat created',
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, message: error.message })
    }
})
