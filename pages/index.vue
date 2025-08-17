<template>
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Find Your Match</h1>

        <MatchFinder
            :matched-user="matchedUser"
            :common-interests="commonInterests"
            :is-loading="isLoading"
            @find-match="findAndCreateMatch"
        />

        <div v-if="loading || isLoading" class="text-center py-8">
            Chargement des matches en cours...
        </div>

        <div v-else class="space-y-8">
            <!-- Pending Chats Section -->
            <div v-if="pendingChats.length">
                <h2 class="text-xl font-semibold mb-4">Pending Chats</h2>
                <div class="space-y-4">
                    <ChatCard
                        v-for="match in pendingChats"
                        :key="match.id"
                        :chat="match"
                        @accept="acceptMatch"
                        @decline="declineMatch"
                    />
                </div>
            </div>

            <!-- Active Chats Section -->
            <div v-if="activeChats.length">
                <h2 class="text-xl font-semibold mb-4">Active Chats</h2>
                <div class="space-y-4">
                    <ChatCard
                        v-for="match in activeChats"
                        :key="match.id"
                        :chat="match"
                    />
                </div>
            </div>

            <!-- User Matches Section -->
            <MatchesSection
                v-if="matches.length"
                :matches="matches"
                :current-user-id="currentUserId"
                :is-processing-match="isProcessingMatch"
                title="Vos matches actuels"
                @accept="acceptMatch"
                @reject="rejectMatch"
            />

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
import MatchFinder from '~/components/MatchFinder.vue'
import ChatCard from '~/components/ChatCard.vue'
import MatchesSection from '~/components/MatchesSection.vue'

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

// Computed property for current user ID
const currentUserId = computed(() => supabaseUser.value?.id || user.value?.id)

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

// Alias for chat cards
const declineMatch = rejectMatch
</script>
