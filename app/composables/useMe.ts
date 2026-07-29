import type { MeDTO } from '~~/shared/types/api'
import type { PatchMeInput } from '~~/shared/schemas/user'

/**
 * The authenticated user's profile (username, space, interests), shared
 * app-wide via useState.
 */
export const useMe = () => {
    const me = useState<MeDTO | null>('me', () => null)
    const isLoading = useState<boolean>('me-loading', () => false)
    const requestFetch = useRequestFetch()

    const fetchMe = async (): Promise<MeDTO | null> => {
        isLoading.value = true
        try {
            me.value = await requestFetch<MeDTO>('/api/user/me')
            return me.value
        } finally {
            isLoading.value = false
        }
    }

    const updateMe = async (patch: PatchMeInput): Promise<MeDTO> => {
        const updated = await $fetch<MeDTO>('/api/user/me', {
            method: 'PATCH',
            body: patch,
        })
        me.value = updated
        return updated
    }

    return { me, isLoading, fetchMe, updateMe }
}
