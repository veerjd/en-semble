<template>
    <div class="h-screen flex flex-col bg-gray-50">
        <!-- Chat Header -->
        <ChatHeader
            :user="otherUser"
            status="Active"
            @back="router.back()"
        />

        <!-- Messages Area -->
        <MessageList
            ref="messageList"
            :messages="messages"
            :loading="loading"
            :current-user-id="currentUser?.id"
            :other-user="otherUser"
        />

        <!-- Message Input -->
        <MessageInput
            ref="messageInput"
            :disabled="sending"
            @send="handleSendMessage"
        />
    </div>
</template>

<script setup>
import ChatHeader from '~/components/ChatHeader.vue'
import MessageList from '~/components/MessageList.vue'
import MessageInput from '~/components/MessageInput.vue'

const route = useRoute()
const router = useRouter()
const { user } = useUser()
const supabaseUser = useSupabaseUser()
const client = useSupabaseClient()

const chatId = route.params.id
const messages = ref([])
const loading = ref(true)
const sending = ref(false)
const otherUser = ref(null)

// Component refs
const messageList = ref(null)
const messageInput = ref(null)

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
        messageList.value?.scrollToBottom()
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

const handleSendMessage = async (messageContent) => {
    if (!messageContent.trim() || sending.value) return

    sending.value = true

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
        // Restore message on error
        messageInput.value?.setMessage(messageContent)
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
                    messageList.value?.scrollToBottom()
                })
            },
        )
        .subscribe()
}

</script>
