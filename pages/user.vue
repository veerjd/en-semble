<template>
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Your User</h1>

        <form @submit.prevent="saveUser" class="space-y-6">
            <div>
                <label
                    for="username"
                    class="block text-sm font-medium text-gray-700"
                    >Username</label
                >
                <input
                    id="username"
                    v-model="user.username"
                    type="text"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div>
                <label for="bio" class="block text-sm font-medium text-gray-700"
                    >Bio</label
                >
                <textarea
                    id="bio"
                    v-model="user.bio"
                    rows="4"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Interests</label
                >
                <div class="flex flex-wrap gap-2">
                    <div
                        v-for="interest in availableInterests"
                        :key="interest.id"
                        @click="toggleInterest(interest)"
                        class="px-4 py-2 rounded-full cursor-pointer text-sm"
                        :class="
                            selectedInterests.includes(interest.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        "
                    >
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
                Save User
            </button>
        </form>
    </div>
</template>

<script setup>
const client = useSupabaseClient()
const user = reactive({ id: '', username: '', bio: '' })
const availableInterests = []
const selectedInterests = []
const error = ref(null)

onMounted(async () => {
    if (user) {
        await loadUser()
        await loadInterests()
    }
})

const loadUser = async () => {
    try {
        const { data } = await client
            .from('users')
            .select(
                `
        *,
        interests (
          id, name
        )
      `,
            )
            .eq('id', user.id)
            .single()

        if (data) {
            user = {
                username: data.username,
                bio: data.bio,
            }
            selectedInterests.value = data.user_interests.map(
                (ui) => ui.interest_id,
            )
        }
    } catch (e) {
        console.error('Error loading user:', e)
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

const saveUser = async () => {
    try {
        error.value = null

        // Update user
        const { error: userError } = await client.from('users').upsert({
            id: user.id,
            username: user.username,
            bio: user.bio,
        })

        if (userError) throw userError

        // Delete existing interests
        await client.from('user_interests').delete().eq('user_id', user.id)

        // Insert new interests
        if (selectedInterests.value.length) {
            const { error: interestsError } = await client
                .from('user_interests')
                .insert(
                    selectedInterests.value.map((interestId) => ({
                        user_id: user.id,
                        interest_id: interestId,
                    })),
                )

            if (interestsError) throw interestsError
        }

        navigateTo('/')
    } catch (e) {
        error.value = e.message
    }
}
</script>
