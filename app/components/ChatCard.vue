<template>
    <div
        class="bg-white p-6 rounded-lg shadow"
        :class="{ 'ring-2 ring-blue-500': isSelected }"
    >
        <div class="flex justify-between items-start">
            <div>
                <h3 class="text-lg font-medium">
                    {{ chat.user.username }}
                </h3>
                <p class="text-gray-600 mt-1">
                    {{ chat.user.bio }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                    <span
                        v-for="interest in chat.user.interests"
                        :key="interest.id"
                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                        {{ interest.name }}
                    </span>
                </div>
            </div>
            <div class="flex gap-2" v-if="showActions">
                <slot name="actions" :chat="chat">
                    <!-- Default actions for pending chats -->
                    <div v-if="chat.status === 'pending' && chat.canAccept">
                        <button
                            @click="$emit('accept', chat.id)"
                            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Accept
                        </button>
                        <button
                            @click="$emit('decline', chat.id)"
                            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
                        >
                            Decline
                        </button>
                    </div>
                    <!-- Default actions for active chats -->
                    <div v-else-if="chat.status === 'accepted'">
                        <NuxtLink
                            :to="`/chat/${chat.channel?.id}`"
                            v-if="chat.channel"
                            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                            <span class="mr-2">Chat</span>
                            <span
                                v-if="chat.unreadCount"
                                class="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                                {{ chat.unreadCount }}
                            </span>
                        </NuxtLink>
                    </div>
                </slot>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    chat: {
        type: Object,
        required: true
    },
    isSelected: {
        type: Boolean,
        default: false
    },
    showActions: {
        type: Boolean,
        default: true
    }
})

defineEmits(['accept', 'decline', 'select'])
</script>