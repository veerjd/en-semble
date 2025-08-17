<template>
    <div class="h-screen flex flex-col bg-gray-50">
        <!-- Chat Header -->
        <div
            class="bg-white border-b border-gray-200 p-4 flex items-center justify-between"
        >
            <div class="flex items-center">
                <button
                    @click="router.back()"
                    class="mr-4 p-2 hover:bg-gray-100 rounded-full"
                >
                    <i class="pi pi-arrow-left text-gray-600"></i>
                </button>
                <div v-if="otherUser" class="flex items-center">
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                    >
                        {{ otherUser.username?.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                        <h1 class="text-lg font-semibold text-gray-900">
                            {{ otherUser.username }}
                        </h1>
                        <p class="text-sm text-gray-500">Active</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button class="p-2 hover:bg-gray-100 rounded-full">
                    <i class="pi pi-info-circle text-gray-600"></i>
                </button>
            </div>
        </div>

        <!-- Messages Area -->
        <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 space-y-4"
        >
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
                        'flex justify-end': message.user_id === currentUser?.id,
                        'flex justify-start':
                            message.user_id !== currentUser?.id,
                    }"
                    class="mb-4"
                >
                    <div
                        :class="{
                            'bg-blue-600 text-white':
                                message.user_id === currentUser?.id,
                            'bg-white text-gray-900 border border-gray-200':
                                message.user_id !== currentUser?.id,
                        }"
                        class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm"
                    >
                        <p class="text-sm">{{ message.content }}</p>
                        <p
                            :class="{
                                'text-blue-200':
                                    message.user_id === currentUser?.id,
                                'text-gray-500':
                                    message.user_id !== currentUser?.id,
                            }"
                            class="text-xs mt-1"
                        >
                            {{ formatTime(message.created_at) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Input -->
        <div class="bg-white border-t border-gray-200 p-4">
            <form
                @submit.prevent="sendMessage"
                class="flex items-center space-x-2"
            >
                <div class="flex-1 relative">
                    <input
                        v-model="newMessage"
                        type="text"
                        placeholder="Type a message..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        :disabled="sending"
                    />
                </div>
                <button
                    type="submit"
                    :disabled="!newMessage.trim() || sending"
                    class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i v-if="sending" class="pi pi-spinner pi-spin"></i>
                    <i v-else class="pi pi-send"></i>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const { user } = useUser()
const supabaseUser = useSupabaseUser()
const client = useSupabaseClient()

const chatId = route.params.id
const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const otherUser = ref(null)

const currentUser = computed(() => user.value || supabaseUser.value)

onMounted(async () => {
    if (!chatId) {
        await router.push('/')
        return
    }

    await loadChat()
    await loadMessages()
    setupRealtimeSubscription()

    // Scroll to bottom after loading
    nextTick(() => {
        scrollToBottom()
    })
})

onUnmounted(() => {
    client.removeAllChannels()
})

const loadChat = async () => {
    try {
        const { data } = await client
            .from('chats')
            .select(
                `
                id,
                matches (
                    user1:users!matches_user1_id_fkey (
                        id,
                        username,
                        bio
                    ),
                    user2:users!matches_user2_id_fkey (
                        id,
                        username,
                        bio
                    )
                )
            `,
            )
            .eq('id', chatId)
            .single()

        if (data?.matches) {
            // Determine which user is the "other" user
            const match = data.matches
            otherUser.value =
                match.user1.id === currentUser.value?.id
                    ? match.user2
                    : match.user1
        }
    } catch (error) {
        console.error('Error loading chat:', error)
    }
}

const loadMessages = async () => {
    try {
        const { data } = await client
            .from('messages')
            .select(
                `
                id,
                content,
                user_id,
                created_at,
                read
            `,
            )
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true })

        messages.value = data || []
    } catch (error) {
        console.error('Error loading messages:', error)
    } finally {
        loading.value = false
    }
}

const sendMessage = async () => {
    if (!newMessage.value.trim() || sending.value) return

    sending.value = true
    const messageContent = newMessage.value.trim()
    newMessage.value = ''

    try {
        await client.from('messages').insert({
            chat_id: chatId,
            user_id: currentUser.value.id,
            content: messageContent,
        })

        // Message will be added via realtime subscription
    } catch (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message. Please try again.')
        newMessage.value = messageContent // Restore message on error
    } finally {
        sending.value = false
    }
}

const setupRealtimeSubscription = () => {
    client
        .channel(`chat-${chatId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`,
            },
            (payload) => {
                messages.value.push(payload.new)
                nextTick(() => {
                    scrollToBottom()
                })
            },
        )
        .subscribe()
}

const scrollToBottom = () => {
    const container = document.querySelector('.overflow-y-auto')
    if (container) {
        container.scrollTop = container.scrollHeight
    }
}

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>
