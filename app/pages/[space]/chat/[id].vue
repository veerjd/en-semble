<script setup lang="ts">
import type { MessageDTO } from '~~/shared/types/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { me } = useMe()

const chatId = route.params.id as string

const {
    chat,
    messages,
    isLoading,
    fetchChat,
    fetchMessages,
    appendMessage,
    sendMessage,
    markRead,
} = useChat(chatId)

const sending = ref(false)
const messageList = ref<{ scrollToBottom: () => void } | null>(null)
const messageInput = ref<{ setMessage: (value: string) => void } | null>(null)

useRealtimeChat(chatId, (message: MessageDTO) => {
    appendMessage(message)
    if (message.userId !== me.value?.id) void markRead()
    nextTick(() => messageList.value?.scrollToBottom())
})

await useAsyncData(`chat-${chatId}`, async () => {
    await Promise.all([fetchChat(), fetchMessages()])
    return true
})

onMounted(() => {
    void markRead()
    nextTick(() => messageList.value?.scrollToBottom())
})

const handleSend = async (content: string) => {
    if (sending.value) return
    sending.value = true
    try {
        await sendMessage(content)
        nextTick(() => messageList.value?.scrollToBottom())
    } catch {
        toast.add({
            severity: 'error',
            summary: t('chat.sendFailed'),
            life: 5000,
        })
        messageInput.value?.setMessage(content)
    } finally {
        sending.value = false
    }
}
</script>

<template>
    <div class="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
        <ChatHeader :user="chat?.otherUser ?? null" @back="router.back()" />

        <MessageList
            ref="messageList"
            :messages="messages"
            :loading="isLoading"
            :current-user-id="me?.id ?? ''"
            :other-user="chat?.otherUser ?? null"
        />

        <MessageInput
            ref="messageInput"
            :placeholder="$t('chat.typeMessage')"
            :disabled="sending"
            @send="handleSend"
        />
    </div>
</template>
