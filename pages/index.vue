<template>
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Find Your Match</h1>

        <div class="mb-8 text-center">
            <Button
                label="Trouver un match automatique"
                icon="pi pi-search"
                class="p-button-lg bg-green-600 hover:bg-green-700 text-white"
                @click="findAndCreateMatch"
            />
        </div>

        <!-- New section to display the newly found match -->
        <div
            v-if="matchedUser"
            class="mb-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-2xl font-semibold mb-4 text-green-800">
                Match trouvé !
            </h2>
            <div class="text-center">
                <h3 class="text-xl font-semibold mb-2">
                    {{ matchedUser.username }}
                </h3>
                <p class="text-gray-600 mb-4">{{ matchedUser.bio }}</p>
                <div class="flex flex-wrap gap-2 justify-center mb-4">
                    <span
                        v-for="interest in matchedUser.interests"
                        :key="interest.id"
                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                        {{ interest.name || interest.slug }}
                    </span>
                </div>
                <div v-if="commonInterests.length" class="mb-2">
                    <span class="font-bold">Intérêts communs :</span>
                    <span class="ml-2">{{ commonInterests.join(', ') }}</span>
                </div>
            </div>
        </div>

        <div v-if="loading || isLoading" class="text-center py-8">
            Chargement des matches en cours...
        </div>

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

            <div v-if="matches.length">
                <h2 class="text-xl font-semibold mb-4">Vos matches actuels</h2>
                <div class="space-y-4">
                    <div
                        v-for="match in matches"
                        :key="match.id"
                        class="bg-slate-700 p-6 rounded-lg shadow"
                    >
                        <template v-if="getOtherUser(match)">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h3
                                        class="text-xl font-semibold text-white"
                                    >
                                        {{ getOtherUser(match).username }}
                                    </h3>
                                    <p class="text-gray-300 mt-2">
                                        {{ getOtherUser(match).bio }}
                                    </p>
                                </div>
                                <div class="ml-4 flex items-center gap-2">
                                    <span
                                        :class="{
                                            'bg-yellow-100 text-yellow-800':
                                                match.status === 'pending',
                                            'bg-green-100 text-green-800':
                                                match.status === 'accepted',
                                            'bg-red-100 text-red-800':
                                                match.status === 'rejected',
                                            'bg-gray-100 text-gray-800':
                                                match.status === 'expired' ||
                                                !match.status,
                                        }"
                                        class="px-3 py-1 rounded-full text-sm font-medium capitalize"
                                    >
                                        {{ match.status || 'unknown' }}
                                    </span>

                                    <!-- Accept/Reject buttons for pending matches -->
                                    <div
                                        v-if="match.status === 'pending'"
                                        class="flex gap-2"
                                    >
                                        <button
                                            @click="acceptMatch(match.id)"
                                            :disabled="
                                                isProcessingMatch === match.id
                                            "
                                            class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {{
                                                isProcessingMatch === match.id
                                                    ? 'Processing...'
                                                    : 'Accept'
                                            }}
                                        </button>
                                        <button
                                            @click="rejectMatch(match.id)"
                                            :disabled="
                                                isProcessingMatch === match.id
                                            "
                                            class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span
                                    v-for="interest in getOtherUser(match)
                                        .interests || []"
                                    :key="interest.id"
                                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                    {{ interest.name || interest.slug }}
                                </span>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <div
                v-if="
                    !pendingChats.length &&
                    !activeChats.length &&
                    !matches.length
                "
                class="text-center py-8 text-gray-600"
            >
                No chats yet. Try finding some people with similar interests!
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button'
import { useMatches } from '~/composables/useMatches'

const { user, fetchUser } = useUser()
const supabaseUser = useSupabaseUser()
const client = useSupabaseClient()
const loading = ref(true)
const chats = ref([])
const unreadCounts = ref({})

const matchedUser = ref(null)
const commonInterests = ref([])
const isProcessingMatch = ref(null)

const { matches, fetchUserMatches, isLoading } = useMatches()
const { currentSpaceId, availableSpaces, initializeSpaceContext } =
    useSpaceContext()
const router = useRouter()

onMounted(async () => {
    try {
        // 1. First, get the authenticated user
        await fetchUser()

        // 2. Initialize space context (depends on user being authenticated)
        await initializeSpaceContext()

        // 3. Only proceed if we have a user (either from useUser or Supabase)
        const currentUser = user.value || supabaseUser.value
        if (currentUser) {
            // 4. Load chats and matches in parallel since they're independent
            // Use supabaseUser.id as the authoritative user ID (UUID)
            const userId = supabaseUser.value?.id || user.value?.id
            const [_, __] = await Promise.all([
                loadChats(),
                userId
                    ? fetchUserMatches(userId)
                    : Promise.resolve(),
            ])

            // 5. Set up real-time subscriptions after data is loaded
            setupRealtimeSubscription()
        }
    } catch (error) {
        console.error('Error during component initialization:', error)
    } finally {
        // Only set loading to false after everything is done (or failed)
        loading.value = false
        isLoading.value = false
    }
})

onUnmounted(() => {
    const supabase = useSupabaseClient()
    supabase.removeAllChannels()
})

const loadChats = async () => {
    // Use consistent user reference
    const currentUser = user.value || supabaseUser.value
    if (!currentUser) {
        console.warn('No authenticated user found for loadChats')
        return
    }

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
                `matches.user1_id.eq.${currentUser.id},matches.user2_id.eq.${currentUser.id}`,
            )

        chats.value = data
            ? data.map((chat) => ({
                  ...chat,
                  user1_id: chat.matches.user1_id,
                  user2_id: chat.matches.user2_id,
                  status: chat.matches.status?.slug || 'unknown',
                  user:
                      chat.matches.user1_id === currentUser.id
                          ? chat.matches.user2
                          : chat.matches.user1,
                  users_chats_user1_id_fkey: chat.matches.user1,
                  users_chats_user2_id_fkey: chat.matches.user2,
                  canAccept:
                      chat.matches.user2_id === currentUser.id &&
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
    const currentUser = user.value || supabaseUser.value
    if (!currentUser || !chats.value || chats.value.length === 0) return

    // Get channel IDs
    const channelIds = chats.value
        .filter((match) => match.channel)
        .map((match) => match.channel.id)

    if (channelIds.length === 0) return

    try {
        const { data } = await client
            .from('messages')
            .select('channel_id, count')
            .not('user_id', 'eq', currentUser.id)
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
    const currentUser = user.value || supabaseUser.value
    if (!currentUser) {
        console.warn(
            'No authenticated user found for setupRealtimeSubscription',
        )
        return
    }

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
                filter: `user_id.neq.${currentUser.id}`,
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
                filter: `user1_id.eq.${currentUser.id}`,
            },
            async () => await loadChats(),
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chats',
                filter: `user2_id.eq.${currentUser.id}`,
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

            // Scroll to the match result
            setTimeout(() => {
                const element = document.querySelector('.bg-green-50')
                if (element) {
                    window.scrollTo({
                        top: element.offsetTop,
                        behavior: 'smooth',
                    })
                }
            }, 100)
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

const acceptMatch = async (matchId) => {
    isProcessingMatch.value = matchId
    try {
        const response = await $fetch(`/api/match/${matchId}/accept`, {
            method: 'POST',
        })

        console.log('Match accepted:', response)

        // Refresh matches to show updated status
        const userId = supabaseUser.value?.id || user.value?.id
        if (userId) {
            await fetchUserMatches(userId)
        }

        // Refresh chats to show new chat
        await loadChats()

        // Navigate to the chat
        if (response.chatId) {
            await router.push(`/chat/${response.chatId}`)
        }
    } catch (error) {
        console.error('Error accepting match:', error)
        alert('Failed to accept match. Please try again.')
    } finally {
        isProcessingMatch.value = null
    }
}

const rejectMatch = async (matchId) => {
    isProcessingMatch.value = matchId
    try {
        await $fetch(`/api/match/${matchId}/reject`, {
            method: 'POST',
        })

        console.log('Match rejected')

        // Refresh matches to show updated status
        const userId = supabaseUser.value?.id || user.value?.id
        if (userId) {
            await fetchUserMatches(userId)
        }
    } catch (error) {
        console.error('Error rejecting match:', error)
        alert('Failed to reject match. Please try again.')
    } finally {
        isProcessingMatch.value = null
    }
}
</script>
