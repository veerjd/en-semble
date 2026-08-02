<script setup lang="ts">
import type { InviteDTO } from '~~/shared/types/api'

const { t } = useI18n()
const toast = useToast()
const { invites, isLoading, fetchInvites, createInvites, revokeInvite } =
    useInvites()

const emailsText = ref('')
const count = ref(1)
const expiresAt = ref<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // one week
)
const creating = ref(false)
const revokingId = ref<string | null>(null)

await useAsyncData('invites', async () => {
    await fetchInvites()
    return true
})

const parsedEmails = computed(() =>
    emailsText.value
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter(Boolean),
)

const handleCreate = async () => {
    if (creating.value) return
    creating.value = true
    try {
        await createInvites({
            emails: parsedEmails.value.length ? parsedEmails.value : undefined,
            count: parsedEmails.value.length ? undefined : count.value,
            expires_at: expiresAt.value.toISOString(),
        })
        emailsText.value = ''
        toast.add({
            severity: 'success',
            summary: t('invite.created'),
            life: 4000,
        })
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

const copyLink = async (invite: InviteDTO) => {
    if (!invite.token) return
    const link = `${window.location.origin}/register/${invite.token}`
    await navigator.clipboard.writeText(link)
    toast.add({ severity: 'info', summary: t('invite.copied'), life: 2500 })
}

const handleRevoke = async (invite: InviteDTO) => {
    if (revokingId.value) return
    revokingId.value = invite.id
    try {
        await revokeInvite(invite.id)
        toast.add({
            severity: 'info',
            summary: t('invite.revoked'),
            life: 3000,
        })
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: t(`errors.${apiErrorCode(err)}`),
            life: 5000,
        })
    } finally {
        revokingId.value = null
    }
}

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const statusSeverity = (status: InviteDTO['status']) =>
    (({ pending: 'info', used: 'success', expired: 'danger' }) as const)[status]
</script>

<template>
    <div class="max-w-3xl mx-auto p-4">
        <h1 class="text-2xl font-bold mb-2">{{ $t('invite.title') }}</h1>
        <p class="text-gray-400 mb-1">{{ $t('invite.intro') }}</p>
        <p class="text-gray-400 mb-6 text-sm">{{ $t('invite.copyOnce') }}</p>

        <form
            class="space-y-4 bg-slate-700 p-6 rounded-lg mb-8"
            @submit.prevent="handleCreate"
        >
            <div>
                <label for="emails" class="font-medium">
                    {{ $t('invite.emails') }}
                </label>
                <Textarea
                    id="emails"
                    v-model="emailsText"
                    rows="3"
                    class="mt-1 block w-full"
                />
            </div>

            <div class="flex flex-wrap gap-4 items-end">
                <div v-if="!parsedEmails.length">
                    <label for="count" class="font-medium block">
                        {{ $t('invite.count') }}
                    </label>
                    <InputNumber
                        id="count"
                        v-model="count"
                        :min="1"
                        :max="100"
                        class="mt-1"
                    />
                </div>

                <div>
                    <label for="expires" class="font-medium block">
                        {{ $t('invite.expiresAt') }}
                    </label>
                    <DatePicker
                        id="expires"
                        v-model="expiresAt"
                        show-time
                        hour-format="24"
                        :min-date="new Date()"
                        class="mt-1"
                    />
                </div>

                <Button
                    type="submit"
                    :label="$t('invite.create')"
                    icon="pi pi-user-plus"
                    :loading="creating"
                />
            </div>
        </form>

        <h2 class="text-xl font-semibold mb-4">
            {{ $t('invite.listTitle') }}
        </h2>

        <div v-if="isLoading" class="text-center py-8">
            <i class="pi pi-spinner pi-spin text-2xl" />
        </div>

        <div v-else class="space-y-2">
            <div
                v-for="invite in invites"
                :key="invite.id"
                class="bg-slate-700 p-4 rounded-lg flex flex-wrap items-center gap-3"
            >
                <Tag
                    :value="$t(`invite.status.${invite.status}`)"
                    :severity="statusSeverity(invite.status)"
                />
                <span class="flex-1 min-w-0 truncate">
                    {{ invite.email ?? $t('invite.anonymous') }}
                </span>
                <span class="text-sm text-gray-400">
                    {{ $t('invite.expiresAt') }}
                    {{ formatDate(invite.expiresAt) }}
                </span>
                <Button
                    v-if="invite.status === 'pending' && invite.token"
                    :label="$t('invite.copyLink')"
                    icon="pi pi-copy"
                    size="small"
                    severity="secondary"
                    @click="copyLink(invite)"
                />
                <Button
                    v-if="invite.status === 'pending'"
                    :label="$t('invite.revoke')"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    outlined
                    :loading="revokingId === invite.id"
                    @click="handleRevoke(invite)"
                />
            </div>
        </div>
    </div>
</template>
