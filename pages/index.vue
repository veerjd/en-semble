<template>
    <div v-if="user" class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Find Your Match</h1>

        <div v-if="loading" class="text-center py-8">
            Loading potential matches...
        </div>

        <div v-else-if="potentialMatches.length" class="space-y-6">
            <div
                v-for="match in potentialMatches"
                :key="match.id"
                class="bg-white p-6 rounded-lg shadow"
            >
                <h3 class="text-xl font-semibold">{{ match.username }}</h3>
                <p class="text-gray-600 mt-2">{{ match.bio }}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                    <span
                        v-for="interest in match.interests"
                        :key="interest.id"
                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                        {{ interest.name }}
                    </span>
                </div>
                <button
                    @click="requestMatch(match.id)"
                    class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Request Match
                </button>
            </div>
        </div>

        <div v-else class="text-center py-8 text-gray-600">
            No potential matches found. Try updating your interests!
        </div>
    </div>
    <div v-else>
        <h1 class="text-3xl font-bold text-center mb-6">
            Welcome to Interest Matcher
        </h1>
        <p class="text-center text-gray-600 mb-8">
            Connect with people who share your interests for meaningful
            conversations.
        </p>
        <div class="text-center">
            <NuxtLink
                to="/login"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                Get Started
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
const user = useSupabaseUser()
const client = useSupabaseClient()
const loading = ref(true)
const potentialMatches = ref([])

onMounted(async () => {
    if (user.value) {
        await loadPotentialMatches()
    }
})

const loadPotentialMatches = async () => {
    try {
        const { data: userInterests } = await client
            .from('user_interests')
            .select('interest_id')
            .eq('user_id', user.value.id)

        const interestIds = userInterests.map((ui) => ui.interest_id)

        const { data: matches } = await client
            .from('users')
            .select(
                `
        id,
        username,
        bio,
        user_interests (
          interest_id,
          interests (
            id,
            name
          )
        )
      `,
            )
            .neq('id', user.value.id)
            .not(
                'id',
                'in',
                (
                    await client
                        .from('matches')
                        .select('user2_id')
                        .eq('user1_id', user.value.id)
                ).data?.map((m) => m.user2_id) || [],
            )

        potentialMatches.value = matches
            .map((match) => ({
                ...match,
                interests: match.user_interests.map((ui) => ui.interests),
            }))
            .filter((match) =>
                match.interests.some((interest) =>
                    interestIds.includes(interest.id),
                ),
            )
    } catch (error) {
        console.error('Error loading matches:', error)
    } finally {
        loading.value = false
    }
}

const requestMatch = async (targetUserId) => {
    try {
        const [user1, user2] = [user.value.id, targetUserId].sort()
        await client.from('matches').insert({
            user1_id: user1,
            user2_id: user2,
            status: 'pending',
        })

        await loadPotentialMatches()
    } catch (error) {
        console.error('Error requesting match:', error)
    }
}
</script>
