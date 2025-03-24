import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO, PostMessageDTO } from '~/shared/types/MessageDTOs'
import { getOneMessage } from './getOneMessage'

export const postMessage = async (
    event: any,
    dto: PostMessageDTO,
): Promise<MessageDTO> => {
    if (!dto.match_id || !dto.user_id || !dto.content) {
        throw createError({
            statusCode: 400,
            message: 'Match ID, User ID, and content are required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    // Verify match exists and user is part of it
    const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', dto.match_id)
        .maybeSingle()

    if (matchError) {
        throw createError({ statusCode: 500, message: matchError.message })
    }

    if (!matchData) {
        throw createError({ statusCode: 404, message: 'Match not found' })
    }

    if (
        matchData.user1_id !== dto.user_id &&
        matchData.user2_id !== dto.user_id
    ) {
        throw createError({
            statusCode: 403,
            message: 'User is not part of this match',
        })
    }

    // Create message
    const { data, error } = await supabase
        .from('messages')
        .insert({
            match_id: dto.match_id,
            user_id: dto.user_id,
            content: dto.content,
            read: dto.read ?? false,
        })
        .select('id')
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Update last_active for user
    const { error: userError } = await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', dto.user_id)

    if (userError) {
        console.error('Error updating user last_active:', userError.message)
        // Don't throw - still want to return message
    }

    return await getOneMessage(event, data.id)
}
