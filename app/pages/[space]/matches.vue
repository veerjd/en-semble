<script setup lang="ts">
import type { InterestDTO, MatchDTO } from '~~/shared/types/api'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const { me, fetchMe } = useMe()
const {
    matches,
    isLoading,
    fetchMatches,
    findMatch,
    respond,
    suggestedInterests,
} = useMatches()
const { replaceMyInterests } = useInterests()
const interestLabel = useInterestLabel()

const finding = ref(false)
const processingId = ref<string | null>(null)
const suggestionsVisible = ref(false)
const suggestions = ref<InterestDTO[]>([])
const addingId = ref<string | null>(null)

await useAsyncData('matches', async () => {
    await fetchMatches()
    return true
})

const handleFind = async () => {
    if (finding.value) return
    finding.value = true
    suggestionsVisible.value = false
    try {
        await findMatch()
        toast.add({
            severity: 'success',
            summary: t('matches.newMatchFound'),
            life: 4000,
        })
    } catch (err) {
        const code = apiErrorCode(err)
        if (code === 'no_overlap') {
            suggestions.value = await suggestedInterests().catch(() => [])
            suggestionsVisible.value = true
        } else if (code === 'no_candidates') {
            toast.add({
                severity: 'info',
                summary: t('matches.noCandidates'),
                life: 5000,
            })
        } else {
            toast.add({
                severity: 'error',
                summary: t(`errors.${code}`),
                life: 5000,
            })
        }
    } finally {
        finding.value = false
    }
}

const handleRespond = async (match: MatchDTO, action: 'accept' | 'reject') => {
    if (processingId.value) return
    processingId.value = match.id
    try {
        const updated = await respond(match.id, action)
        if (action === 'accept' && updated.status === 'matched') {
            await navigateTo(`/${route.params.space}/chat/${updated.chatId}`)
            return
        }
        toast.add({
            severity: action === 'accept' ? 'success' : 'info',
            summary: t(
                action === 'accept' ? 'matches.accepted' : 'matches.rejected',
            ),
            life: 4000,
        })
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: t(`errors.${apiErrorCode(err)}`),
            life: 5000,
        })
    } finally {
        processingId.value = null
    }
}

const addSuggestedInterest = async (interest: InterestDTO) => {
    if (addingId.value) return
    addingId.value = interest.id
    try {
        const currentIds = me.value?.interests.map((i) => i.id) ?? []
        await replaceMyInterests([...currentIds, interest.id])
        await fetchMe()
        suggestions.value = suggestions.value.filter(
            (s) => s.id !== interest.id,
        )
        toast.add({
            severity: 'success',
            summary: t('matches.interestAdded'),
            life: 3000,
        })
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: t(`errors.${apiErrorCode(err)}`),
            life: 5000,
        })
    } finally {
        addingId.value = null
    }
}

const visibleMatches = computed(() =>
    matches.value.filter((m) => m.status !== 'rejected'),
)
</script>

<template>
    <div class="max-w-3xl mx-auto p-4">
        <div class="mb-8 text-center">
            <h1 class="text-2xl font-bold mb-4">{{ $t('matches.title') }}</h1>
            <Button
                :label="$t('matches.findButton')"
                icon="pi pi-search"
                size="large"
                :loading="finding"
                @click="handleFind"
            />
        </div>

        <div v-if="isLoading" class="text-center py-8">
            <i class="pi pi-spinner pi-spin text-2xl" />
        </div>

        <div v-else-if="visibleMatches.length" class="space-y-4">
            <MatchCard
                v-for="match in visibleMatches"
                :key="match.id"
                :match="match"
                :space="String(route.params.space)"
                :processing="processingId === match.id"
                @accept="handleRespond(match, 'accept')"
                @reject="handleRespond(match, 'reject')"
            />
        </div>

        <p v-else class="text-center text-gray-400 py-8">
            {{ $t('matches.empty') }}
        </p>

        <Dialog
            v-model:visible="suggestionsVisible"
            modal
            :header="$t('matches.noOverlapTitle')"
            class="max-w-lg mx-4"
        >
            <p class="mb-4">{{ $t('matches.noOverlapBody') }}</p>
            <div class="flex flex-wrap gap-2 mb-4">
                <Button
                    v-for="interest in suggestions"
                    :key="interest.id"
                    :label="interestLabel(interest)"
                    icon="pi pi-plus"
                    size="small"
                    severity="secondary"
                    :loading="addingId === interest.id"
                    @click="addSuggestedInterest(interest)"
                />
            </div>
            <div class="flex justify-end gap-2">
                <Button
                    :label="$t('common.close')"
                    severity="secondary"
                    text
                    @click="suggestionsVisible = false"
                />
                <Button
                    :label="$t('common.retry')"
                    icon="pi pi-refresh"
                    :loading="finding"
                    @click="handleFind"
                />
            </div>
        </Dialog>
    </div>
</template>
