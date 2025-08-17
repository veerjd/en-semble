<template>
    <div class="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 bg-blue-600 text-white">
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-semibold">{{ title }}</h1>
                <Button
                    icon="pi pi-search"
                    class="p-button-rounded p-button-text p-button-sm text-white"
                    @click="$emit('find-match')"
                    :loading="isLoadingMatch"
                />
            </div>
        </div>

        <!-- Search/Filter Bar -->
        <div class="p-3 border-b border-gray-200">
            <div class="relative">
                <i
                    class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                ></i>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search conversations..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>

        <!-- Chat List -->
        <div class="flex-1 overflow-y-auto">
            <div v-if="loading" class="p-4 text-center text-gray-500">
                Loading conversations...
            </div>

            <!-- Pending Chats Section -->
            <div v-if="filteredPendingChats.length > 0" class="border-b border-gray-200">
                <div class="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Pending Requests ({{ filteredPendingChats.length }})
                    </h3>
                </div>
                <div
                    v-for="chat in filteredPendingChats"
                    :key="chat.id"
                    class="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    @click="$emit('select-chat', chat)"
                    :class="{
                        'bg-blue-50 border-l-4 border-l-blue-500': selectedChatId === chat.id,
                    }"
                >
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                    >
                        {{ chat.user?.username?.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">
                                {{ chat.user?.username }}
                            </p>
                            <span class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                Pending
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 truncate">
                            {{ chat.user?.bio || 'New match request' }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Active Chats Section -->
            <div v-if="filteredActiveChats.length > 0">
                <div class="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Active Conversations ({{ filteredActiveChats.length }})
                    </h3>
                </div>
                <div
                    v-for="chat in filteredActiveChats"
                    :key="chat.id"
                    class="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    @click="$emit('select-chat', chat)"
                    :class="{
                        'bg-blue-50 border-l-4 border-l-blue-500': selectedChatId === chat.id,
                    }"
                >
                    <div class="relative">
                        <div
                            class="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                        >
                            {{ chat.user?.username?.charAt(0).toUpperCase() }}
                        </div>
                        <div
                            v-if="chat.unreadCount > 0"
                            class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                        >
                            {{ chat.unreadCount > 9 ? '9+' : chat.unreadCount }}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">
                                {{ chat.user?.username }}
                            </p>
                            <div class="flex items-center space-x-2">
                                <NuxtLink
                                    v-if="chat.channel"
                                    :to="`/chat/${chat.channel.id}`"
                                    class="text-blue-600 hover:text-blue-800 text-sm"
                                    @click.stop
                                >
                                    <i class="pi pi-external-link"></i>
                                </NuxtLink>
                            </div>
                        </div>
                        <p class="text-sm text-gray-500 truncate">
                            {{ chat.user?.bio || 'Click to start chatting' }}
                        </p>
                        <div v-if="chat.user?.interests?.length" class="flex flex-wrap gap-1 mt-1">
                            <span
                                v-for="interest in chat.user.interests.slice(0, 2)"
                                :key="interest.id"
                                class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                                {{ interest.name || interest.slug }}
                            </span>
                            <span
                                v-if="chat.user.interests.length > 2"
                                class="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                            >
                                +{{ chat.user.interests.length - 2 }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div
                v-if="!loading && !filteredPendingChats.length && !filteredActiveChats.length"
                class="p-8 text-center text-gray-500"
            >
                <i class="pi pi-comments text-4xl text-gray-300 mb-4"></i>
                <p class="text-lg font-medium mb-2">No conversations yet</p>
                <p class="text-sm">Click the search button to find new matches!</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button'

const props = defineProps({
    chats: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    selectedChatId: {
        type: [String, Number],
        default: null
    },
    title: {
        type: String,
        default: 'Messenger'
    },
    isLoadingMatch: {
        type: Boolean,
        default: false
    }
})

defineEmits(['select-chat', 'find-match'])

const searchQuery = ref('')

// Computed properties for filtered chats
const filteredPendingChats = computed(() => {
    const pending = props.chats.filter((chat) => chat.status === 'pending')
    if (!searchQuery.value) return pending
    return pending.filter(
        (chat) =>
            chat.user?.username?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            chat.user?.bio?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const filteredActiveChats = computed(() => {
    const active = props.chats.filter((chat) => chat.status === 'accepted')
    if (!searchQuery.value) return active
    return active.filter(
        (chat) =>
            chat.user?.username?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            chat.user?.bio?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>