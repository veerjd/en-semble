import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database, Tables } from '~~/shared/types/database.types'

/**
 * Live match notifications: a new potential match appearing, or the other
 * party responding. RLS limits the subscription to the caller's own match
 * rows; we still filter client-side for safety.
 */
export const useRealtimeMatches = () => {
    const client = useSupabaseClient<Database>()
    const { me } = useMe()
    const { fetchMatches } = useMatches()
    const toast = useToast()
    const { t } = useI18n()
    let channel: RealtimeChannel | null = null

    const involvesMe = (row: Tables<'matches'>) =>
        me.value !== null &&
        (row.user1_id === me.value.id || row.user2_id === me.value.id)

    onMounted(() => {
        channel = client
            .channel('my-matches')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matches' },
                (payload) => {
                    const row = payload.new as Tables<'matches'>
                    if (!involvesMe(row)) return
                    void fetchMatches()
                    toast.add({
                        severity: 'info',
                        summary: t('matches.newMatchFound'),
                        life: 5000,
                    })
                },
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matches' },
                (payload) => {
                    const row = payload.new as Tables<'matches'>
                    if (!involvesMe(row)) return
                    void fetchMatches()
                },
            )
            .subscribe()
    })

    onUnmounted(() => {
        if (channel) client.removeChannel(channel)
    })
}
