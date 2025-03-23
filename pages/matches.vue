<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Your Matches</h1>
    
    <div v-if="loading" class="text-center py-8">
      Loading matches...
    </div>
    
    <div v-else class="space-y-8">
      <div v-if="pendingMatches.length">
        <h2 class="text-xl font-semibold mb-4">Pending Matches</h2>
        <div class="space-y-4">
          <div v-for="match in pendingMatches" :key="match.id"
               class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-medium">{{ match.profile.username }}</h3>
                <p class="text-gray-600 mt-1">{{ match.profile.bio }}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span v-for="interest in match.profile.interests" :key="interest.id"
                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {{ interest.name }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2" v-if="match.canAccept">
                <button @click="acceptMatch(match.id)"
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Accept
                </button>
                <button @click="declineMatch(match.id)"
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeMatches.length">
        <h2 class="text-xl font-semibold mb-4">Active Matches</h2>
        <div class="space-y-4">
          <div v-for="match in activeMatches" :key="match.id"
               class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-medium">{{ match.profile.username }}</h3>
            <p class="text-gray-600 mt-1">{{ match.profile.bio }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span v-for="interest in match.profile.interests" :key="interest.id"
                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {{ interest.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="!pendingMatches.length && !activeMatches.length" 
           class="text-center py-8 text-gray-600">
        No matches yet. Try finding some people with similar interests!
      </div>
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const client = useSupabaseClient()
const loading = ref(true)
const matches = ref([])

onMounted(async () => {
  if (user.value) {
    await loadMatches()
  }
})

const loadMatches = async () => {
  try {
    const { data } = await client
      .from('matches')
      .select(`
        *,
        profiles!matches_user1_id_fkey (
          username,
          bio,
          user_interests (
            interests (
              id,
              name
            )
          )
        ),
        profiles!matches_user2_id_fkey (
          username,
          bio,
          user_interests (
            interests (
              id,
              name
            )
          )
        )
      `)
      .or(`user1_id.eq.${user.value.id},user2_id.eq.${user.value.id}`)
    
    matches.value = data.map(match => ({
      ...match,
      profile: match.user1_id === user.value.id 
        ? match.profiles_matches_user2_id_fkey
        : match.profiles_matches_user1_id_fkey,
      canAccept: match.user2_id === user.value.id && match.status === 'pending'
    }))
  } catch (error) {
    console.error('Error loading matches:', error)
  } finally {
    loading.value = false
  }
}

const pendingMatches = computed(() => 
  matches.value.filter(match => match.status === 'pending')
)

const activeMatches = computed(() => 
  matches.value.filter(match => match.status === 'accepted')
)

const acceptMatch = async (matchId) => {
  try {
    await client
      .from('matches')
      .update({ status: 'accepted' })
      .eq('id', matchId)
    
    await loadMatches()
  } catch (error) {
    console.error('Error accepting match:', error)
  }
}

const declineMatch = async (matchId) => {
  try {
    await client
      .from('matches')
      .delete()
      .eq('id', matchId)
    
    await loadMatches()
  } catch (error) {
    console.error('Error declining match:', error)
  }
}
</script>