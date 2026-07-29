<template>
    <div v-if="matches.length" class="space-y-4">
        <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
        <div class="space-y-4">
            <MatchCard
                v-for="match in matches"
                :key="match.id"
                :match="match"
                :current-user-id="currentUserId"
                :is-processing="isProcessingMatch === match.id"
                @accept="handleAccept"
                @reject="handleReject"
            />
        </div>
    </div>
</template>

<script setup>
import MatchCard from './MatchCard.vue'

const props = defineProps({
    matches: {
        type: Array,
        default: () => []
    },
    title: {
        type: String,
        required: true
    },
    currentUserId: {
        type: String,
        required: true
    },
    isProcessingMatch: {
        type: [String, Number],
        default: null
    }
})

const emit = defineEmits(['accept', 'reject'])

const handleAccept = (matchId) => {
    emit('accept', matchId)
}

const handleReject = (matchId) => {
    emit('reject', matchId)
}
</script>