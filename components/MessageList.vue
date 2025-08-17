<template>
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="loading" class="text-center py-8">
            <i class="pi pi-spinner pi-spin text-2xl text-gray-400"></i>
            <p class="text-gray-500 mt-2">Loading messages...</p>
        </div>

        <div v-else-if="messages.length === 0" class="text-center py-8">
            <div
                class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            >
                {{ otherUser?.username?.charAt(0).toUpperCase() }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Start a conversation with {{ otherUser?.username }}
            </h3>
            <p class="text-gray-500">Say hello and break the ice!</p>
        </div>

        <div v-else>
            <div
                v-for="message in messages"
                :key="message.id"
                :class="{
                    'flex justify-end': message.user_id === currentUserId,
                    'flex justify-start': message.user_id !== currentUserId,
                }"
                class="mb-4"
            >
                <div
                    :class="{
                        'bg-blue-600 text-white': message.user_id === currentUserId,
                        'bg-white text-gray-900 border border-gray-200': message.user_id !== currentUserId,
                    }"
                    class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm"
                >
                    <p class="text-sm">{{ message.content }}</p>
                    <p
                        :class="{
                            'text-blue-200': message.user_id === currentUserId,
                            'text-gray-500': message.user_id !== currentUserId,
                        }"
                        class="text-xs mt-1"
                    >
                        {{ formatTime(message.created_at) }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    messages: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    currentUserId: {
        type: String,
        required: true
    },
    otherUser: {
        type: Object,
        default: null
    }
})

const messagesContainer = ref(null)

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

// Watch for new messages and scroll to bottom
watch(() => props.messages.length, () => {
    nextTick(() => {
        scrollToBottom()
    })
})

// Expose scrollToBottom method to parent
defineExpose({
    scrollToBottom
})
</script>