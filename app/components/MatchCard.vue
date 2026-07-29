<script setup lang="ts">
import type { MatchDTO } from '~~/shared/types/api'

const props = defineProps<{
    match: MatchDTO
    space: string
    processing?: boolean
}>()

defineEmits<{
    accept: []
    reject: []
}>()

const interestLabel = useInterestLabel()

const statusSeverity = computed(
    () =>
        (
            ({
                awaiting_me: 'warn',
                awaiting_them: 'info',
                matched: 'success',
                rejected: 'danger',
            }) as const
        )[props.match.status],
)
</script>

<template>
    <div class="bg-slate-700 p-6 rounded-lg shadow">
        <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
                <h3 class="text-xl font-semibold text-white">
                    {{ match.otherUser.username }}
                </h3>
                <p v-if="match.otherUser.bio" class="text-gray-300 mt-2">
                    {{ match.otherUser.bio }}
                </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap justify-end">
                <Tag
                    :value="$t(`matches.status.${match.status}`)"
                    :severity="statusSeverity"
                />

                <template v-if="match.status === 'awaiting_me'">
                    <Button
                        :label="$t('matches.accept')"
                        icon="pi pi-check"
                        size="small"
                        severity="success"
                        :loading="processing"
                        @click="$emit('accept')"
                    />
                    <Button
                        :label="$t('matches.reject')"
                        icon="pi pi-times"
                        size="small"
                        severity="danger"
                        outlined
                        :disabled="processing"
                        @click="$emit('reject')"
                    />
                </template>

                <NuxtLink
                    v-if="match.status === 'matched' && match.chatId"
                    :to="`/${space}/chat/${match.chatId}`"
                >
                    <Button
                        :label="$t('matches.openChat')"
                        icon="pi pi-comments"
                        size="small"
                        :badge="
                            match.unreadCount
                                ? String(match.unreadCount)
                                : undefined
                        "
                    />
                </NuxtLink>
            </div>
        </div>

        <div v-if="match.commonInterests.length" class="mt-4">
            <span class="text-sm font-semibold text-gray-300">
                {{ $t('matches.commonInterests') }}
            </span>
            <div class="flex flex-wrap gap-2 mt-2">
                <span
                    v-for="interest in match.commonInterests"
                    :key="interest.id"
                    class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                    {{ interestLabel(interest) }}
                </span>
            </div>
        </div>

        <div v-if="match.otherUser.interests.length" class="mt-3">
            <div class="flex flex-wrap gap-2">
                <span
                    v-for="interest in match.otherUser.interests"
                    :key="interest.id"
                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                    {{ interestLabel(interest) }}
                </span>
            </div>
        </div>
    </div>
</template>
