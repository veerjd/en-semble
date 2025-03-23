<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Your Profile</h1>
    
    <form @submit.prevent="saveProfile" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
        <input
          id="username"
          v-model="profile.username"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          id="bio"
          v-model="profile.bio"
          rows="4"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Interests</label>
        <div class="flex flex-wrap gap-2">
          <div v-for="interest in availableInterests" :key="interest.id"
               @click="toggleInterest(interest)"
               class="px-4 py-2 rounded-full cursor-pointer text-sm"
               :class="selectedInterests.includes(interest.id) 
                 ? 'bg-blue-600 text-white' 
                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
            {{ interest.name }}
          </div>
        </div>
      </div>
      
      <div v-if="error" class="text-red-600 text-sm">
        {{ error }}
      </div>
      
      <button
        type="submit"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Save Profile
      </button>
    </form>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const client = useSupabaseClient()
const profile = ref({ username: '', bio: '' })
const availableInterests = ref([])
const selectedInterests = ref([])
const error = ref(null)

onMounted(async () => {
  if (user.value) {
    await loadProfile()
    await loadInterests()
  }
})

const loadProfile = async () => {
  try {
    const { data } = await client
      .from('profiles')
      .select(`
        *,
        user_interests (
          interest_id
        )
      `)
      .eq('id', user.value.id)
      .single()
    
    if (data) {
      profile.value = {
        username: data.username,
        bio: data.bio
      }
      selectedInterests.value = data.user_interests.map(ui => ui.interest_id)
    }
  } catch (e) {
    console.error('Error loading profile:', e)
  }
}

const loadInterests = async () => {
  try {
    const { data } = await client
      .from('interests')
      .select('*')
      .order('name')
    
    if (data) {
      availableInterests.value = data
    }
  } catch (e) {
    console.error('Error loading interests:', e)
  }
}

const toggleInterest = (interest) => {
  const index = selectedInterests.value.indexOf(interest.id)
  if (index === -1) {
    selectedInterests.value.push(interest.id)
  } else {
    selectedInterests.value.splice(index, 1)
  }
}

const saveProfile = async () => {
  try {
    error.value = null
    
    // Update profile
    const { error: profileError } = await client
      .from('profiles')
      .upsert({
        id: user.value.id,
        username: profile.value.username,
        bio: profile.value.bio
      })
    
    if (profileError) throw profileError
    
    // Delete existing interests
    await client
      .from('user_interests')
      .delete()
      .eq('user_id', user.value.id)
    
    // Insert new interests
    if (selectedInterests.value.length) {
      const { error: interestsError } = await client
        .from('user_interests')
        .insert(
          selectedInterests.value.map(interestId => ({
            user_id: user.value.id,
            interest_id: interestId
          }))
        )
      
      if (interestsError) throw interestsError
    }
    
    navigateTo('/')
  } catch (e) {
    error.value = e.message
  }
}
</script>