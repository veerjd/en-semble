<template>
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Your Chats</h1>

        <div v-if="loading" class="text-center py-8">Loading chats...</div>

        <div v-else class="space-y-8">
            <div v-if="pendingChats.length">
                <h2 class="text-xl font-semibold mb-4">Pending Chats</h2>
                <div class="space-y-4">
                    <div
                        v-for="match in pendingChats"
                        :key="match.id"
                        class="bg-white p-6 rounded-lg shadow"
                    >
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-medium">
                                    {{ match.user.username }}
                                </h3>
                                <p class="text-gray-600 mt-1">
                                    {{ match.user.bio }}
                                </p>
                                <div class="mt-2 flex flex-wrap gap-2">
                                    <span
                                        v-for="interest in match.user.interests"
                                        :key="interest.id"
                                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {{ interest.name }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-2" v-if="match.canAccept">
                                <button
                                    @click="acceptMatch(match.id)"
                                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Accept
                                </button>
                                <button
                                    @click="declineMatch(match.id)"
                                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeChats.length">
                <h2 class="text-xl font-semibold mb-4">Active Chats</h2>
                <div class="space-y-4">
                    <div
                        v-for="match in activeChats"
                        :key="match.id"
                        class="bg-white p-6 rounded-lg shadow"
                    >
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-medium">
                                    {{ match.user.username }}
                                </h3>
                                <p class="text-gray-600 mt-1">
                                    {{ match.user.bio }}
                                </p>
                                <div class="mt-2 flex flex-wrap gap-2">
                                    <span
                                        v-for="interest in match.user.interests"
                                        :key="interest.id"
                                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {{ interest.name }}
                                    </span>
                                </div>
                            </div>
                            <NuxtLink
                                :to="`/chat/${match.channel?.id}`"
                                v-if="match.channel"
                                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                            >
                                <span class="mr-2">Chat</span>
                                <span
                                    v-if="match.unreadCount"
                                    class="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    {{ match.unreadCount }}
                                </span>
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="!pendingChats.length && !activeChats.length"
                class="text-center py-8 text-gray-600"
            >
                No chats yet. Try finding some people with similar interests!
            </div>
        </div>
    </div>
</template>

<script setup>
const user = useSupabaseUser()
const client = useSupabaseClient()
const loading = ref(true)
const chats = ref([])
const unreadCounts = ref({})

onMounted(async () => {
    if (user.value) {
        await loadChats()
        setupRealtimeSubscription()
    }
})

onUnmounted(() => {
    const supabase = useSupabaseClient()
    supabase.removeAllChannels()
})

const loadChats = async () => {
    try {
        const { data } = await client
            .from('chats')
            .select(
                `
        *,
        users!chats_user1_id_fkey (
          username,
          bio,
          user_interests (
            interests (
              id,
              name
            )
          )
        ),
        users!chats_user2_id_fkey (
          username,
          bio,
          user_interests (
            interests (
              id,
              name
            )
          )
        ),
        channels (
          id
        )
      `,
            )
            .or(`user1_id.eq.${user.value.id},user2_id.eq.${user.value.id}`)

        chats.value = data
            ? data.map((match) => ({
                  ...match,
                  user:
                      match.user1_id === user.value.id
                          ? match.users_chats_user2_id_fkey
                          : match.users_chats_user1_id_fkey,
                  canAccept:
                      match.user2_id === user.value.id &&
                      match.status === 'pending',
                  channel: match.channels[0],
                  unreadCount: 0,
              }))
            : []

        await loadUnreadCounts()
    } catch (error) {
        console.error('Error loading chats:', error)
    } finally {
        loading.value = false
    }
}

const loadUnreadCounts = async () => {
    if (!chats.value || chats.value.length === 0) return

    // Get channel IDs
    const channelIds = chats.value
        .filter((match) => match.channel)
        .map((match) => match.channel.id)

    if (channelIds.length === 0) return

    try {
        const { data } = await client
            .from('messages')
            .select('channel_id, count')
            .not('user_id', 'eq', user.value.id)
            .eq('read', false)
            .in('channel_id', channelIds)
            .group('channel_id')
            .count()

        const countsMap = {}
        data.forEach((item) => {
            countsMap[item.channel_id] = parseInt(item.count)
        })

        chats.value = chats.value.map((match) => ({
            ...match,
            unreadCount: match.channel ? countsMap[match.channel.id] || 0 : 0,
        }))
    } catch (error) {
        console.error('Error loading unread counts:', error)
    }
}

const setupRealtimeSubscription = () => {
    const supabase = useSupabaseClient()

    // Subscribe to new messages
    supabase
        .channel('messages-channel')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `user_id.neq.${user.value.id}`,
            },
            async (payload) => {
                // Reload unread counts when a new message arrives
                if (payload.eventType === 'INSERT') {
                    await loadUnreadCounts()
                }
            },
        )
        .subscribe()

    // Subscribe to match changes
    supabase
        .channel('match-channel')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chats',
                filter: `user1_id.eq.${user.value.id}`,
            },
            async () => await loadChats(),
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chats',
                filter: `user2_id.eq.${user.value.id}`,
            },
            async () => await loadChats(),
        )
        .subscribe()

    // Subscribe to channel changes
    supabase
        .channel('channel-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'channels',
            },
            async () => await loadChats(),
        )
        .subscribe()
}

const pendingChats = computed(() =>
    chats.value.filter((match) => match.status === 'pending'),
)

const activeChats = computed(() =>
    chats.value.filter((match) => match.status === 'accepted'),
)

const acceptMatch = async (matchId) => {
    try {
        await client
            .from('chats')
            .update({ status: 'accepted' })
            .eq('id', matchId)

        await loadChats()
    } catch (error) {
        console.error('Error accepting match:', error)
    }
}

const declineMatch = async (matchId) => {
    try {
        await client.from('chats').delete().eq('id', matchId)

        await loadChats()
    } catch (error) {
        console.error('Error declining match:', error)
    }
}
</script>
