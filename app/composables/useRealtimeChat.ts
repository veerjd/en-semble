import type { RealtimeChannel } from '@supabase/supabase-js'
import type { MessageDTO } from '~~/shared/types/api'
import type { Database, Tables } from '~~/shared/types/database.types'

/**
 * Subscribe to new messages in a chat. Realtime is the ONLY thing the
 * browser Supabase client is used for — all reads/writes go through the
 * server API. Removes its own channel on unmount (never removeAllChannels,
 * which used to kill sibling subscriptions).
 */
export const useRealtimeChat = (
    chatId: string,
    onMessage: (message: MessageDTO) => void,
) => {
    const client = useSupabaseClient<Database>()
    let channel: RealtimeChannel | null = null

    onMounted(() => {
        channel = client
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    const row = payload.new as Tables<'chat_messages'>
                    onMessage({
                        id: row.id,
                        chatId: row.chat_id,
                        userId: row.user_id,
                        content: row.content,
                        readAt: row.read_at,
                        createdAt: row.created_at,
                    })
                },
            )
            .subscribe()
    })

    onUnmounted(() => {
        if (channel) client.removeChannel(channel)
    })
}
