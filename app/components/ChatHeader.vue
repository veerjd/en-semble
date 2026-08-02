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
        class="bg-surface-0 dark:bg-surface-900 border-b border-surface p-4 flex items-center justify-between rounded-t-lg"
    >
        <div class="flex items-center">
            <Button
                v-if="showBackButton"
                :aria-label="$t('chat.back')"
                icon="pi pi-arrow-left"
                text
                rounded
                severity="secondary"
                class="mr-4"
                @click="$emit('back')"
            />
            <div v-if="user" class="flex items-center">
                <Avatar
                    :label="user.username?.charAt(0).toUpperCase()"
                    shape="circle"
                    size="large"
                    class="mr-3 bg-primary text-primary-contrast"
                />
                <div>
                    <h1 class="text-lg font-semibold text-color">
                        {{ user.username }}
                    </h1>
                    <p
                        v-if="user.bio"
                        class="text-sm text-muted-color truncate max-w-xs"
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
