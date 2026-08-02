<script setup lang="ts">
import type { InterestDTO } from '~~/shared/types/api'

const { t } = useI18n()
const toast = useToast()
const { me, fetchMe, updateMe } = useMe()
const { interests, fetchInterests, createInterest, replaceMyInterests } =
    useInterests()
const interestLabel = useInterestLabel()

const username = ref('')
const bio = ref('')
const selected = ref<InterestDTO[]>([])
const search = ref('')
const saving = ref(false)
const creating = ref(false)

await useAsyncData('profile-init', async () => {
    if (!me.value) await fetchMe()
    await fetchInterests()
    return true
})

watch(
    me,
    (value) => {
        if (!value) return
        username.value = value.username
        bio.value = value.bio ?? ''
        selected.value = [...value.interests]
    },
    { immediate: true },
)

const searchResults = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return []
    const selectedIds = new Set(selected.value.map((i) => i.id))
    return interests.value
        .filter(
            (i) =>
                !selectedIds.has(i.id) &&
                (interestLabel(i).toLowerCase().includes(query) ||
                    i.slug.includes(query.replace(/\s+/g, '_'))),
        )
        .slice(0, 8)
})

const canCreate = computed(() => {
    const query = search.value.trim()
    if (query.length < 2 || query.length > 50) return false
    const normalized = query.toLowerCase()
    return !interests.value.some(
        (i) =>
            i.label.toLowerCase() === normalized ||
            interestLabel(i).toLowerCase() === normalized,
    )
})

const addInterest = (interest: InterestDTO) => {
    if (!selected.value.some((i) => i.id === interest.id)) {
        selected.value = [...selected.value, interest]
    }
    search.value = ''
}

const removeInterest = (interest: InterestDTO) => {
    selected.value = selected.value.filter((i) => i.id !== interest.id)
}

const handleCreate = async () => {
    if (!canCreate.value || creating.value) return
    creating.value = true
    try {
        const interest = await createInterest(search.value.trim())
        addInterest(interest)
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: t(`errors.${apiErrorCode(err)}`),
            life: 5000,
        })
    } finally {
        creating.value = false
    }
}

const handleSave = async () => {
    if (saving.value) return
    saving.value = true
    try {
        await updateMe({
            username: username.value,
            bio: bio.value || null,
        })
        await replaceMyInterests(selected.value.map((i) => i.id))
        await fetchMe()
        toast.add({
            severity: 'success',
            summary: t('profile.saved'),
            life: 3000,
        })
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: t(`errors.${apiErrorCode(err)}`),
            life: 5000,
        })
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div class="max-w-2xl mx-auto p-4">
        <h1 class="text-2xl font-bold mb-6">{{ $t('profile.title') }}</h1>

        <form class="space-y-6" @submit.prevent="handleSave">
            <div>
                <label for="username" class="font-medium">
                    {{ $t('profile.username') }}
                </label>
                <InputText
                    id="username"
                    v-model="username"
                    required
                    minlength="3"
                    maxlength="30"
                    class="mt-1 block w-full"
                />
            </div>

            <div>
                <label for="bio" class="font-medium">
                    {{ $t('profile.bio') }}
                </label>
                <Textarea
                    id="bio"
                    v-model="bio"
                    rows="3"
                    maxlength="500"
                    class="mt-1 block w-full"
                />
            </div>

            <div>
                <label class="font-medium">{{ $t('profile.interests') }}</label>
                <p class="text-sm text-muted-color mb-2">
                    {{ $t('profile.interestsHint') }}
                </p>

                <div v-if="selected.length" class="flex flex-wrap gap-2 mb-3">
                    <Chip
                        v-for="interest in selected"
                        :key="interest.id"
                        :label="interestLabel(interest)"
                        removable
                        @remove="removeInterest(interest)"
                    />
                </div>

                <InputText
                    v-model="search"
                    :placeholder="$t('profile.searchInterests')"
                    class="block w-full"
                />

                <div
                    v-if="searchResults.length || canCreate"
                    class="mt-2 flex flex-wrap gap-2"
                >
                    <Button
                        v-for="interest in searchResults"
                        :key="interest.id"
                        :label="interestLabel(interest)"
                        icon="pi pi-plus"
                        size="small"
                        severity="secondary"
                        @click="addInterest(interest)"
                    />
                    <Button
                        v-if="canCreate"
                        :label="
                            $t('profile.createInterest', {
                                label: search.trim(),
                            })
                        "
                        icon="pi pi-plus-circle"
                        size="small"
                        :loading="creating"
                        @click="handleCreate"
                    />
                </div>
            </div>

            <Button
                type="submit"
                :label="$t('common.save')"
                :loading="saving"
            />
        </form>
    </div>
</template>
