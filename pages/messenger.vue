<template>
    <div class="h-screen flex bg-gray-100">
        <!-- Chat Sidebar -->
        <ChatSidebar
            :chats="chats"
            :loading="loading"
            :selected-chat-id="selectedChat?.id"
            :is-loading-match="isLoading"
            @select-chat="selectChat"
            @find-match="findAndCreateMatch"
        />

        <!-- Main Chat Area -->
        <div class="flex-1 flex flex-col">
            <div
                v-if="!selectedChat"
                class="flex-1 flex items-center justify-center bg-gray-50"
            >
                <div class="text-center">
                    <i class="pi pi-comment text-6xl text-gray-300 mb-4"></i>
                    <h2 class="text-2xl font-semibold text-gray-600 mb-2">
                        Welcome to Messenger
                    </h2>
                    <p class="text-gray-500">
                        Select a conversation to start chatting
                    </p>
                </div>
            </div>

            <!-- Selected Chat View -->
            <div v-else class="flex-1 flex flex-col">
                <!-- Chat Header -->
                <ChatHeader
                    :user="selectedChat.user"
                    :status="selectedChat.status === 'pending' ? 'Match request pending' : 'Active conversation'"
                    :show-back-button="false"
                >
                    <template #actions>
                        <NuxtLink
                            v-if="selectedChat.channel"
                            :to="`/chat/${selectedChat.channel.id}`"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Open Chat
                        </NuxtLink>
                    </template>
                </ChatHeader>

                <!-- Chat Content -->
                <div class="flex-1 p-6 bg-gray-50">
                    <div
                        v-if="selectedChat.status === 'pending'"
                        class="max-w-md mx-auto text-center"
                    >
                        <div class="bg-white p-6 rounded-lg shadow-sm">
                            <h4
                                class="text-lg font-semibold text-gray-900 mb-2"
                            >
                                Match Request
                            </h4>
                            <p class="text-gray-600 mb-4">
                                {{ selectedChat.user?.username }} wants to
                                connect with you!
                            </p>

                            <div v-if="selectedChat.user?.bio" class="mb-4">
                                <p class="text-sm text-gray-700 italic">
                                    "{{ selectedChat.user.bio }}"
                                </p>
                            </div>

                            <div
                                v-if="selectedChat.user?.interests?.length"
                                class="mb-6"
                            >
                                <p
                                    class="text-sm font-medium text-gray-700 mb-2"
                                >
                                    Shared interests:
                                </p>
                                <div
                                    class="flex flex-wrap gap-2 justify-center"
                                >
                                    <span
                                        v-for="interest in selectedChat.user
                                            .interests"
                                        :key="interest.id"
                                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {{ interest.name || interest.slug }}
                                    </span>
                                </div>
                            </div>

                            <div
                                v-if="selectedChat.canAccept"
                                class="flex gap-3 justify-center"
                            >
                                <button
                                    @click="acceptMatch(selectedChat.id)"
                                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Accept
                                </button>
                                <button
                                    @click="declineMatch(selectedChat.id)"
                                    class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center text-gray-500">
                        <p class="mb-4">This conversation is active!</p>
                        <NuxtLink
                            v-if="selectedChat.channel"
                            :to="`/chat/${selectedChat.channel.id}`"
                            class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Open Full Chat
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- New Match Modal/Toast -->
        <div
            v-if="matchedUser"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            @click="matchedUser = null"
        >
            <div
                class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
                @click.stop
            >
                <div class="text-center">
                    <div
                        class="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                    >
                        {{ matchedUser.username?.charAt(0).toUpperCase() }}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        New Match Found!
                    </h3>
                    <p class="text-lg font-medium text-blue-600 mb-2">
                        {{ matchedUser.username }}
                    </p>
                    <p class="text-gray-600 mb-4">{{ matchedUser.bio }}</p>

                    <div v-if="commonInterests.length" class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">
                            Common interests:
                        </p>
                        <div class="flex flex-wrap gap-2 justify-center">
                            <span
                                v-for="interest in commonInterests"
                                :key="interest"
                                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                                {{ interest }}
                            </span>
                        </div>
                    </div>

                    <button
                        @click="matchedUser = null"
                        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Great!
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button'
import { useMatches } from '~/composables/useMatches'
import ChatSidebar from '~/components/ChatSidebar.vue'
import ChatHeader from '~/components/ChatHeader.vue'

const { user, fetchUser } = useUser()
const supabaseUser = useSupabaseUser()
const client = useSupabaseClient()
const loading = ref(true)
const chats = ref([])
const selectedChat = ref(null)
const searchQuery = ref('')

const matchedUser = ref(null)
const commonInterests = ref([])

const { matches, fetchUserMatches, isLoading } = useMatches()
const { currentSpaceId, availableSpaces } = useSpaceContext()

onMounted(async () => {
    await fetchUser()

    if (user.value || supabaseUser.value) {
        await loadChats()
        setupRealtimeSubscription()

        const userId = supabaseUser.value?.id || user.value?.id
        if (userId) {
            await fetchUserMatches(userId)
        }
    }
    loading.value = false
    isLoading.value = false
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
        matches!inner (
          id,
          user1_id,
          user2_id,
          status:match_statuses (
            id,
            slug
          ),
          user1:users!matches_user1_id_fkey (
            id,
            username,
            bio,
            user_interests (
              interests (
                id,
                name
              )
            )
          ),
          user2:users!matches_user2_id_fkey (
            id,
            username,
            bio,
            user_interests (
              interests (
                id,
                name
              )
            )
          )
        ),
        channels (
          id
        )
      `,
            )
            .or(
                `matches.user1_id.eq.${
                    (user.value || supabaseUser.value).id
                },matches.user2_id.eq.${(user.value || supabaseUser.value).id}`,
            )

        chats.value = data
            ? data.map((chat) => ({
                  ...chat,
                  user1_id: chat.matches.user1_id,
                  user2_id: chat.matches.user2_id,
                  status: chat.matches.status?.slug || 'unknown',
                  user:
                      chat.matches.user1_id ===
                      (user.value || supabaseUser.value).id
                          ? chat.matches.user2
                          : chat.matches.user1,
                  users_chats_user1_id_fkey: chat.matches.user1,
                  users_chats_user2_id_fkey: chat.matches.user2,
                  canAccept:
                      chat.matches.user2_id ===
                          (user.value || supabaseUser.value).id &&
                      chat.matches.status?.slug === 'pending',
                  channel: chat.channels[0],
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
            .not('user_id', 'eq', (user.value || supabaseUser.value).id)
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
                filter: `user_id.neq.${(user.value || supabaseUser.value).id}`,
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
                filter: `user1_id.eq.${(user.value || supabaseUser.value).id}`,
            },
            async () => await loadChats(),
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chats',
                filter: `user2_id.eq.${(user.value || supabaseUser.value).id}`,
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

// Computed properties for filtered chats
const filteredPendingChats = computed(() => {
    const pending = chats.value.filter((match) => match.status === 'pending')
    if (!searchQuery.value) return pending
    return pending.filter(
        (chat) =>
            chat.user?.username
                ?.toLowerCase()
                .includes(searchQuery.value.toLowerCase()) ||
            chat.user?.bio
                ?.toLowerCase()
                .includes(searchQuery.value.toLowerCase()),
    )
})

const filteredActiveChats = computed(() => {
    const active = chats.value.filter((match) => match.status === 'accepted')
    if (!searchQuery.value) return active
    return active.filter(
        (chat) =>
            chat.user?.username
                ?.toLowerCase()
                .includes(searchQuery.value.toLowerCase()) ||
            chat.user?.bio
                ?.toLowerCase()
                .includes(searchQuery.value.toLowerCase()),
    )
})

// Chat selection
const selectChat = (chat) => {
    selectedChat.value = chat
}

const acceptMatch = async (matchId) => {
    try {
        await client
            .from('chats')
            .update({ status: 'accepted' })
            .eq('id', matchId)

        await loadChats()

        // Update selected chat if it's the one we just accepted
        if (selectedChat.value?.id === matchId) {
            selectedChat.value = chats.value.find((chat) => chat.id === matchId)
        }
    } catch (error) {
        console.error('Error accepting match:', error)
    }
}

const declineMatch = async (matchId) => {
    try {
        await client.from('chats').delete().eq('id', matchId)

        await loadChats()

        // Clear selected chat if it's the one we just declined
        if (selectedChat.value?.id === matchId) {
            selectedChat.value = null
        }
    } catch (error) {
        console.error('Error declining match:', error)
    }
}

const findAndCreateMatch = async () => {
    try {
        // Use space context to get current space
        console.log('user.value:', user.value)
        console.log('user.value?.space:', user.value?.space)
        console.log('currentSpaceId:', currentSpaceId.value)
        console.log('availableSpaces:', availableSpaces.value)

        // Try to get space ID from space context first, then fallback to user space
        const spaceId = currentSpaceId.value || user.value?.space?.id
        if (!spaceId) {
            alert('Aucun espace associé à votre profil.')
            return
        }
        const userId = supabaseUser.value?.id || user.value?.id
        if (!userId) {
            alert('User not authenticated.')
            return
        }
        const data = await $fetch(
            `/api/user/${userId}/find-and-create-match`,
            {
                method: 'POST',
                body: { spaceId },
            },
        )

        if (data && data.match && data.match.user2) {
            matchedUser.value = data.match.user2
            commonInterests.value = data.commonInterests

            console.log('Nouveau match créé:', data.match)

            // Reload chats to show the new match
            await loadChats()
        } else {
            matchedUser.value = null
        }
    } catch (err) {
        matchedUser.value = null
        console.error('Erreur lors de la recherche de match automatique :', err)

        // Show user-friendly error messages
        if (err.data?.message?.includes('Aucun utilisateur disponible')) {
            alert(
                'Vous avez déjà été associé avec tous les utilisateurs disponibles dans votre espace.',
            )
        } else if (
            err.data?.message?.includes(
                'Aucun utilisateur avec des intérêts communs',
            )
        ) {
            alert(
                'Aucun utilisateur avec des intérêts communs trouvé parmi les utilisateurs disponibles.',
            )
        } else {
            alert('Erreur lors de la recherche de match. Veuillez réessayer.')
        }
    }
}

const getOtherUser = (match) => {
    const currentUser = user.value || supabaseUser.value
    if (!currentUser) return null
    const userId = supabaseUser.value?.id || user.value?.id
    return match.user1?.id === userId ? match.user2 : match.user1
}
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
