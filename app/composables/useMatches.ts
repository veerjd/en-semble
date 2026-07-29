import type { InterestDTO, MatchDTO } from '~~/shared/types/api'

export const useMatches = () => {
    const matches = useState<MatchDTO[]>('matches', () => [])
    const isLoading = useState<boolean>('matches-loading', () => false)
    const requestFetch = useRequestFetch()

    const fetchMatches = async (): Promise<MatchDTO[]> => {
        isLoading.value = true
        try {
            matches.value = await requestFetch<MatchDTO[]>('/api/matches')
            return matches.value
        } finally {
            isLoading.value = false
        }
    }

    /** Ask the product for a new match. Throws with code 'no_overlap' /
     *  'no_candidates' when none is possible. */
    const findMatch = async (): Promise<MatchDTO> => {
        const match = await $fetch<MatchDTO>('/api/matches/find', {
            method: 'POST',
        })
        matches.value = [match, ...matches.value]
        return match
    }

    const respond = async (
        matchId: string,
        response: 'accept' | 'reject',
    ): Promise<MatchDTO> => {
        const updated = await $fetch<MatchDTO>(
            `/api/matches/${matchId}/${response}`,
            { method: 'POST' },
        )
        matches.value = matches.value.map((m) =>
            m.id === updated.id ? updated : m,
        )
        return updated
    }

    const suggestedInterests = (): Promise<InterestDTO[]> =>
        $fetch<InterestDTO[]>('/api/interests/suggested')

    return {
        matches,
        isLoading,
        fetchMatches,
        findMatch,
        respond,
        suggestedInterests,
    }
}
