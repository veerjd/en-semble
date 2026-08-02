<script setup lang="ts">
import type { MatchUserDTO, MessageDTO } from '~~/shared/types/api'

const props = withDefaults(
    defineProps<{
        messages: MessageDTO[]
        loading?: boolean
        currentUserId: string
        otherUser?: MatchUserDTO | null
    }>(),
    { messages: () => [], loading: false, otherUser: null },
)

const messagesContainer = ref<HTMLElement | null>(null)

const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

watch(
    () => props.messages.length,
    () => {
        nextTick(scrollToBottom)
    },
)

defineExpose({ scrollToBottom })
</script>

<template>
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner
                style="width: 2rem; height: 2rem"
                stroke-width="4"
            />
            <p class="text-muted-color mt-2">
                {{ $t('chat.loadingMessages') }}
            </p>
        </div>

        <div v-else-if="messages.length === 0" class="text-center py-8">
            <Avatar
                :label="otherUser?.username?.charAt(0).toUpperCase()"
                shape="circle"
                size="xlarge"
                class="bg-primary text-primary-contrast mx-auto mb-4"
            />
            <h3 class="text-lg font-semibold mb-2">
                {{
                    $t('chat.startConversation', {
                        name: otherUser?.username ?? '?',
                    })
                }}
            </h3>
            <p class="text-muted-color">{{ $t('chat.sayHello') }}</p>
        </div>

        <div v-else>
            <div
                v-for="message in messages"
                :key="message.id"
                class="mb-4 flex"
                :class="
                    message.userId === currentUserId
                        ? 'justify-end'
                        : 'justify-start'
                "
            >
                <div
                    :class="
                        message.userId === currentUserId
                            ? 'bg-primary text-primary-contrast'
                            : 'bg-surface-0 dark:bg-surface-800 text-color border border-surface'
                    "
                    class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm"
                >
                    <p class="text-sm">{{ message.content }}</p>
                    <p class="text-xs mt-1 opacity-70">
                        {{ formatTime(message.createdAt) }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
