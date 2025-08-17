<template>
    <div class="mb-8 text-center">
        <Button
            label="Trouver un match automatique"
            icon="pi pi-search"
            class="p-button-lg bg-green-600 hover:bg-green-700 text-white"
            @click="$emit('find-match')"
            :loading="isLoading"
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
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
    matchedUser: {
        type: Object,
        default: null
    },
    commonInterests: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})

defineEmits(['find-match'])
</script>