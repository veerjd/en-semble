import type { InviteDTO, InviteLookupDTO } from '~~/shared/types/api'
import type { CreateInvitesInput } from '~~/shared/schemas/invite'

export const useInvites = () => {
    const invites = useState<InviteDTO[]>('invites', () => [])
    const isLoading = useState<boolean>('invites-loading', () => false)
    const requestFetch = useRequestFetch()

    const fetchInvites = async (): Promise<InviteDTO[]> => {
        isLoading.value = true
        try {
            invites.value = await requestFetch<InviteDTO[]>('/api/invites')
            return invites.value
        } finally {
            isLoading.value = false
        }
    }

    const createInvites = async (
        input: CreateInvitesInput,
    ): Promise<InviteDTO[]> => {
        const created = await $fetch<InviteDTO[]>('/api/invites', {
            method: 'POST',
            body: input,
        })
        invites.value = [...created, ...invites.value]
        return created
    }

    const revokeInvite = async (inviteId: string): Promise<void> => {
        await $fetch(`/api/invites/${inviteId}`, { method: 'DELETE' })
        invites.value = invites.value.filter((i) => i.id !== inviteId)
    }

    const lookupInvite = (token: string): Promise<InviteLookupDTO> =>
        $fetch<InviteLookupDTO>(
            `/api/invites/lookup/${encodeURIComponent(token)}`,
        )

    return {
        invites,
        isLoading,
        fetchInvites,
        createInvites,
        revokeInvite,
        lookupInvite,
    }
}
