import { serverSupabaseClient } from '#supabase/server'
import type { MessageDTO, PostMessageDTO } from '~/shared/types/MessageDTOs'
import { getOneMessage } from './getOneMessage'

export const postMessage = async (
    event: any,
    dto: PostMessageDTO,
): Promise<MessageDTO> => {
    if (!dto.chat_id || !dto.user_id || !dto.content) {
        throw createError({
            statusCode: 400,
            message: 'Chat ID, User ID, and content are required',
        })
    }

    const supabase = await serverSupabaseClient(event)

    // Vérifier que le chat existe et que l'utilisateur en fait partie
    const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('user1_id, user2_id')
        .eq('id', dto.chat_id)
        .maybeSingle()

    if (chatError) {
        throw createError({ statusCode: 500, message: chatError.message })
    }

    if (!chatData) {
        throw createError({ statusCode: 404, message: 'Chat not found' })
    }

    if (
        chatData.user1_id !== dto.user_id &&
        chatData.user2_id !== dto.user_id
    ) {
        throw createError({
            statusCode: 403,
            message: "L'utilisateur ne fait pas partie de ce chat",
        })
    }

    // Créer le message
    const { data, error } = await supabase
        .from('messages')
        .insert({
            chat_id: dto.chat_id,
            user_id: dto.user_id,
            content: dto.content,
            read: dto.read ?? false,
        })
        .select('id')
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Mettre à jour last_active pour l'utilisateur
    const { error: userError } = await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', dto.user_id)

    if (userError) {
        console.error(
            'Erreur lors de la mise à jour de last_active:',
            userError.message,
        )
        // Ne pas throw - on veut quand même retourner le message
    }

    return await getOneMessage(event, data.id)
}
