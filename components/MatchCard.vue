<template>
    <div class="bg-slate-700 p-6 rounded-lg shadow">
        <template v-if="otherUser">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-xl font-semibold text-white">
                        {{ otherUser.username }}
                    </h3>
                    <p class="text-gray-300 mt-2">
                        {{ otherUser.bio }}
                    </p>
                </div>
                <div class="ml-4 flex items-center gap-2">
                    <span
                        :class="{
                            'bg-yellow-100 text-yellow-800': match.status === 'pending',
                            'bg-green-100 text-green-800': match.status === 'accepted',
                            'bg-red-100 text-red-800': match.status === 'rejected',
                            'bg-gray-100 text-gray-800': match.status === 'expired' || !match.status,
                        }"
                        class="px-3 py-1 rounded-full text-sm font-medium capitalize"
                    >
                        {{ match.status || 'unknown' }}
                    </span>

                    <!-- Accept/Reject buttons for pending matches -->
                    <div v-if="match.status === 'pending'" class="flex gap-2">
                        <button
                            @click="$emit('accept', match.id)"
                            :disabled="isProcessing"
                            class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {{ isProcessing ? 'Processing...' : 'Accept' }}
                        </button>
                        <button
                            @click="$emit('reject', match.id)"
                            :disabled="isProcessing"
                            class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reject
                        </button>
                    </div>

                    <!-- Chat button for accepted matches -->
                    <div v-if="match.status === 'accepted' && match.chat" class="flex gap-2">
                        <NuxtLink
                            :to="`/chat/${match.chat.id}`"
                            class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                            <i class="pi pi-comments"></i>
                            Chat
                        </NuxtLink>
                    </div>
                </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
                <span
                    v-for="interest in otherUser.interests || []"
                    :key="interest.id"
                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                    {{ interest.name || interest.slug }}
                </span>
            </div>
        </template>
    </div>
</template>

<script setup>
const props = defineProps({
    match: {
        type: Object,
        required: true
    },
    currentUserId: {
        type: String,
        required: true
    },
    isProcessing: {
        type: Boolean,
        default: false
    }
})

defineEmits(['accept', 'reject'])

const otherUser = computed(() => {
    if (!props.currentUserId) return null
    return props.match.user1?.id === props.currentUserId 
        ? props.match.user2 
        : props.match.user1
})
</script>