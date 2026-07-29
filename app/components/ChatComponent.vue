<template>
    <div class="max-w-3xl mx-auto">
        <div v-if="loading" class="text-center py-8">
            Loading conversation...
        </div>

        <div v-else-if="error" class="text-center py-8 text-red-600">
            {{ error }}
        </div>

        <div v-else class="h-screen flex flex-col">
            <!-- Chat header -->
            <div class="bg-white shadow p-4 flex items-center">
                <NuxtLink to="/chats" class="mr-4 text-blue-600">
                    <i class="pi pi-arrow-left"></i>
                </NuxtLink>
                <div>
                    <h1 class="text-xl font-semibold">
                        {{ matchUser.username }}
                    </h1>
                    <div class="text-sm text-gray-600 flex flex-wrap gap-1">
                        <span
                            v-for="interest in matchUser.interests"
                            :key="interest.id"
                            class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                            {{ interest.name }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Messages container -->
            <div
                ref="messagesContainer"
                class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100"
            >
                <div
                    v-if="messages.length === 0"
                    class="text-center text-gray-500 py-8"
                >
                    No messages yet. Start the conversation!
                </div>

                <div
                    v-for="message in messages"
                    :key="message.id"
                    class="flex"
                    :class="
                        message.user_id === user.id
                            ? 'justify-end'
                            : 'justify-start'
                    "
                >
                    <div
                        class="max-w-[70%] p-3 rounded-lg"
                        :class="
                            message.user_id === user.id
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 rounded-tl-none'
                        "
                    >
                        <p>{{ message.content }}</p>
                        <p class="text-xs opacity-70 text-right mt-1">
                            {{ formatMessageTime(message.created_at) }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Message input -->
            <div class="bg-white p-4 border-t">
                <form @submit.prevent="sendMessage" class="flex gap-2">
                    <input
                        v-model="newMessage"
                        type="text"
                        placeholder="Type a message..."
                        class="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        class="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700"
                        :disabled="!newMessage.trim()"
                    >
                        <i class="pi pi-send"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
const route = useRoute()
const channelId = route.params.id
const user = useSupabaseUser()
const client = useSupabaseClient()

const loading = ref(true)
const error = ref(null)
const matchUser = ref(null)
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)

onMounted(async () => {
    if (user.value) {
        await Promise.all([loadChannel(), loadMessages()])
        scrollToBottom()
        markMessagesAsRead()
        setupRealtimeSubscription()
    }
})

onUnmounted(() => {
    const supabase = useSupabaseClient()
    supabase.removeAllChannels()
})

watch(messages, () => {
    nextTick(() => {
        scrollToBottom()
    })
})

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const loadChannel = async () => {
    try {
        const { data, error: channelError } = await client
            .from('channels')
            .select(
                `
        *,
        chats (
          user1_id,
          user2_id,
          users!chats_user1_id_fkey (
            username,
            user_interests (
              interests (
                id,
                name
              )
            )
          ),
          users!chats_user2_id_fkey (
            username,
            user_interests (
              interests (
                id,
                name
              )
            )
          )
        )
      `,
            )
            .eq('id', channelId)
            .single()

        if (channelError) throw channelError

        if (!data) {
            error.value = 'Channel not found'
            loading.value = false
            return
        }

        const match = data.chats
        const otherUserId =
            match.user1_id === user.value.id ? match.user2_id : match.user1_id
        const otherUserUser =
            match.user1_id === user.value.id
                ? match.users_chats_user2_id_fkey
                : match.users_chats_user1_id_fkey

        matchUser.value = {
            ...otherUserUser,
            interests: otherUserUser.user_interests.map((ui) => ui.interests),
        }
    } catch (e) {
        console.error('Error loading channel:', e)
        error.value = 'Error loading channel information'
    }
}

const loadMessages = async () => {
    try {
        const { data, error: messagesError } = await client
            .from('messages')
            .select('*')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true })

        if (messagesError) throw messagesError

        messages.value = data || []
    } catch (e) {
        console.error('Error loading messages:', e)
        error.value = 'Error loading messages'
    } finally {
        loading.value = false
    }
}

const markMessagesAsRead = async () => {
    try {
        const unreadMessages = messages.value
            .filter(
                (message) => !message.read && message.user_id !== user.value.id,
            )
            .map((message) => message.id)

        if (unreadMessages.length > 0) {
            await client
                .from('messages')
                .update({ read: true })
                .in('id', unreadMessages)
        }
    } catch (e) {
        console.error('Error marking messages as read:', e)
    }
}

const setupRealtimeSubscription = () => {
    const supabase = useSupabaseClient()

    supabase
        .channel(`messages-${channelId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${channelId}`,
            },
            async (payload) => {
                const newMessage = payload.new

                // Add message to list if it's not already there
                if (!messages.value.some((m) => m.id === newMessage.id)) {
                    messages.value.push(newMessage)

                    // Mark the message as read if it's from the other user
                    if (newMessage.user_id !== user.value.id) {
                        await markMessageAsRead(newMessage.id)
                    }
                }
            },
        )
        .subscribe()
}

const markMessageAsRead = async (messageId) => {
    try {
        await client.from('messages').update({ read: true }).eq('id', messageId)
    } catch (e) {
        console.error('Error marking message as read:', e)
    }
}

const sendMessage = async () => {
    if (!newMessage.value.trim()) return

    try {
        const { error: insertError } = await client.from('messages').insert({
            channel_id: channelId,
            user_id: user.value.id,
            content: newMessage.value.trim(),
        })

        if (insertError) throw insertError

        newMessage.value = ''
    } catch (e) {
        console.error('Error sending message:', e)
        alert('Failed to send message. Please try again.')
    }
}

const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
