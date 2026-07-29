import type { ChatDTO, MessageDTO } from '~~/shared/types/api'

/** Data access for one chat: metadata, messages, send, mark-read. */
export const useChat = (chatId: string) => {
    const chat = ref<ChatDTO | null>(null)
    const messages = ref<MessageDTO[]>([])
    const isLoading = ref(false)
    const requestFetch = useRequestFetch()

    const fetchChat = async (): Promise<ChatDTO> => {
        chat.value = await requestFetch<ChatDTO>(`/api/chat/${chatId}`)
        return chat.value
    }

    const fetchMessages = async (): Promise<MessageDTO[]> => {
        isLoading.value = true
        try {
            messages.value = await requestFetch<MessageDTO[]>(
                `/api/chat/${chatId}/messages`,
            )
            return messages.value
        } finally {
            isLoading.value = false
        }
    }

    /** Load the previous page of history (before the oldest loaded message). */
    const fetchOlderMessages = async (): Promise<MessageDTO[]> => {
        const oldest = messages.value[0]
        if (!oldest) return []
        const older = await $fetch<MessageDTO[]>(
            `/api/chat/${chatId}/messages`,
            { query: { before: oldest.createdAt } },
        )
        messages.value = [...older, ...messages.value]
        return older
    }

    const appendMessage = (message: MessageDTO) => {
        if (messages.value.some((m) => m.id === message.id)) return
        messages.value = [...messages.value, message]
    }

    const sendMessage = async (content: string): Promise<MessageDTO> => {
        const message = await $fetch<MessageDTO>(
            `/api/chat/${chatId}/messages`,
            { method: 'POST', body: { content } },
        )
        appendMessage(message)
        return message
    }

    const markRead = (): Promise<{ ok: true }> =>
        $fetch<{ ok: true }>(`/api/chat/${chatId}/read`, { method: 'POST' })

    return {
        chat,
        messages,
        isLoading,
        fetchChat,
        fetchMessages,
        fetchOlderMessages,
        appendMessage,
        sendMessage,
        markRead,
    }
}
