<script setup lang="ts">
import type { MatchUserDTO } from '~~/shared/types/api'

withDefaults(
    defineProps<{
        user?: MatchUserDTO | null
        showBackButton?: boolean
    }>(),
    { user: null, showBackButton: true },
)

defineEmits<{ back: [] }>()
</script>

<template>
    <div
        class="bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg"
    >
        <div class="flex items-center">
            <button
                v-if="showBackButton"
                :aria-label="$t('chat.back')"
                class="mr-4 p-2 hover:bg-gray-100 rounded-full"
                @click="$emit('back')"
            >
                <i class="pi pi-arrow-left text-gray-600" />
            </button>
            <div v-if="user" class="flex items-center">
                <div
                    class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                >
                    {{ user.username?.charAt(0).toUpperCase() }}
                </div>
                <div>
                    <h1 class="text-lg font-semibold text-gray-900">
                        {{ user.username }}
                    </h1>
                    <p
                        v-if="user.bio"
                        class="text-sm text-gray-500 truncate max-w-xs"
                    >
                        {{ user.bio }}
                    </p>
                </div>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <slot name="actions" />
        </div>
    </div>
</template>
