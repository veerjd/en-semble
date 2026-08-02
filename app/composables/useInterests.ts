import type { InterestDTO } from '~~/shared/types/api'

export const useInterests = () => {
    const interests = useState<InterestDTO[]>('interests', () => [])
    const isLoading = useState<boolean>('interests-loading', () => false)
    const requestFetch = useRequestFetch()

    /** All interests (autocomplete source). */
    const fetchInterests = async (): Promise<InterestDTO[]> => {
        isLoading.value = true
        try {
            interests.value =
                await requestFetch<InterestDTO[]>('/api/interests')
            return interests.value
        } finally {
            isLoading.value = false
        }
    }

    /** Create a user-generated interest (dedupes by slug server-side). */
    const createInterest = async (label: string): Promise<InterestDTO> => {
        const interest = await $fetch<InterestDTO>('/api/interests', {
            method: 'POST',
            body: { label },
        })
        if (!interests.value.some((i) => i.id === interest.id)) {
            interests.value = [...interests.value, interest].sort((a, b) =>
                a.label.localeCompare(b.label),
            )
        }
        return interest
    }

    /** Replace the caller's interest set. */
    const replaceMyInterests = (
        interestIds: string[],
    ): Promise<InterestDTO[]> =>
        $fetch<InterestDTO[]>('/api/user/me/interests', {
            method: 'PUT',
            body: { interest_ids: interestIds },
        })

    return {
        interests,
        isLoading,
        fetchInterests,
        createInterest,
        replaceMyInterests,
    }
}
