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
                            <h3 class="text-xl font-semibold text-white">
                                {{ getOtherUser(match).username }}
                            </h3>
                            <p class="text-gray-300 mt-2">
                                {{ getOtherUser(match).bio }}
                            </p>
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

const { matches, fetchUserMatches, isLoading } = useMatches()

onMounted(async () => {
    await fetchUser()

    if (user.value || supabaseUser.value) {
        await loadChats()
        setupRealtimeSubscription()

        if (user.value) {
            await fetchUserMatches(user.value.id)
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
            name
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
                  status: chat.matches.status?.name || 'unknown',
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
                      chat.matches.status?.name === 'pending',
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

const findAndCreateMatch = async () => {
    try {
        // On suppose que l'utilisateur a un champ space_id
        const spaceId = user.value?.space?.id
        if (!spaceId) {
            alert('Aucun espace associé à votre profil.')
            return
        }
        const data = await $fetch(
            `/api/user/${user.value.id}/find-and-create-match`,
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
    if (!user.value) return null
    return match.user1?.id === user.value.id ? match.user2 : match.user1
}
</script>
