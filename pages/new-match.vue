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

        <Dialog
            v-model:visible="showMatchDialog"
            modal
            header="Match trouvé !"
            :closable="true"
            :style="{ width: '400px' }"
        >
            <template v-if="matchedUser">
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
                        <span class="ml-2">{{
                            commonInterests.join(', ')
                        }}</span>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="text-center text-gray-600">Aucun match trouvé.</div>
            </template>
        </Dialog>

        <div v-if="loading || isLoading" class="text-center py-8">
            Chargement des matches en cours...
        </div>

        <div v-else-if="matches.length" class="space-y-6">
            <div
                v-for="match in matches"
                :key="match.id"
                class="bg-slate-700 p-6 rounded-lg shadow"
            >
                <template v-if="getOtherUser(match)">
                    <h3 class="text-xl font-semibold">
                        {{ getOtherUser(match).username }}
                    </h3>
                    <p class="text-gray-600 mt-2">
                        {{ getOtherUser(match).bio }}
                    </p>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <span
                            v-for="interest in getOtherUser(match).interests ||
                            []"
                            :key="interest.id"
                            class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                            {{ interest.name }}
                        </span>
                    </div>
                </template>
            </div>
        </div>

        <div v-else class="text-center py-8 text-gray-600">
            Aucun match en cours trouvé.
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useMatches } from '~/composables/useMatches'

const { user, fetchUser } = useUser()
const client = useSupabaseClient()
const loading = ref(true)

const showMatchDialog = ref(false)
const matchedUser = ref(null)
const commonInterests = ref([])

const { matches, fetchUserMatches, isLoading } = useMatches()

onMounted(async () => {
    await fetchUser()

    if (user.value) {
        await fetchUserMatches(user.value.id)
        loading.value = false
        isLoading.value = false
    }
})

const findAndCreateMatch = async () => {
    try {
        // On suppose que l'utilisateur a un champ space_id
        const spaceId = user.value.space?.id
        if (!spaceId) {
            alert('Aucun espace associé à votre profil.')
            return
        }
        const { data, error } = await $fetch(
            `/api/user/${user.value.id}/find-and-create-match`,
            {
                method: 'POST',
                body: { spaceId },
            },
        )
        if (error) throw error
        if (data && data.match && data.match.user2) {
            matchedUser.value = data.match.user2
            commonInterests.value = data.commonInterests
            showMatchDialog.value = true
        } else {
            matchedUser.value = null
            showMatchDialog.value = true
        }
    } catch (err) {
        matchedUser.value = null
        showMatchDialog.value = true
        console.error('Erreur lors de la recherche de match automatique :', err)
    }
}

const getOtherUser = (match) => {
    if (!user.value) return null
    return match.user1?.id === user.value.id ? match.user2 : match.user1
}
</script>
