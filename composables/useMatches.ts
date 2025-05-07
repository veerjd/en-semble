import type {
    MatchDTO,
    PostMatchDTO,
    PatchMatchDTO,
    DeleteMatchDTO,
    SoftDeleteMatchDTO,
} from '~/shared/types/MatchDTOs'

export const useMatches = () => {
    const matches: Ref<MatchDTO[]> = ref([])
    const currentMatch: Ref<MatchDTO | null> = ref(null)
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    /**
     * Récupérer tous les matches d'un utilisateur
     */
    const fetchUserMatches = async (userId: string): Promise<MatchDTO[]> => {
        isLoading.value = true
        error.value = null

        // Vérifier le cache d'abord
        const { data: cachedData } = useNuxtData(`matches-user-${userId}`)
        if (cachedData.value?.length > 0) {
            matches.value = cachedData.value
            isLoading.value = false
            return cachedData.value
        }

        try {
            const { data, error: fetchError } = await useFetch<MatchDTO[]>(
                `/api/user/${userId}/matches`,
                {
                    headers: useRequestHeaders(['cookie']),
                    key: `matches-user-${userId}`,
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            matches.value = data.value || []
            return matches.value
        } catch (err: any) {
            error.value = err
            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Récupérer tous les matches d'un espace
     */
    const fetchSpaceMatches = async (spaceId: string): Promise<MatchDTO[]> => {
        isLoading.value = true
        error.value = null

        const { data: cachedData } = useNuxtData(`matches-space-${spaceId}`)
        if (cachedData.value?.length > 0) {
            matches.value = cachedData.value
            isLoading.value = false
            return cachedData.value
        }

        try {
            const { data, error: fetchError } = await useFetch<MatchDTO[]>(
                `/api/space/${spaceId}/matches`,
                {
                    headers: useRequestHeaders(['cookie']),
                    key: `matches-space-${spaceId}`,
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            matches.value = data.value || []
            return matches.value
        } catch (err: any) {
            error.value = err
            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Récupérer un match par ID
     */
    const getMatchById = async (id: string): Promise<MatchDTO | null> => {
        isLoading.value = true
        error.value = null
        try {
            const { data, error: fetchError } = await useFetch<MatchDTO>(
                `/api/match/${id}`,
                {
                    headers: useRequestHeaders(['cookie']),
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            currentMatch.value = data.value || null
            return currentMatch.value
        } catch (err: any) {
            error.value = err
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Créer un nouveau match
     */
    const createMatch = async (dto: PostMatchDTO): Promise<MatchDTO | null> => {
        isLoading.value = true
        error.value = null
        try {
            const { data, error: fetchError } = await useFetch<MatchDTO>(
                '/api/match',
                {
                    method: 'POST',
                    body: dto,
                    headers: useRequestHeaders(['cookie']),
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            const newMatch = data.value
            if (newMatch) {
                matches.value = [...matches.value, newMatch]
                clearNuxtData('matches')
            }
            return newMatch || null
        } catch (err: any) {
            error.value = err
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Mettre à jour un match existant
     */
    const updateMatch = async (
        id: string,
        dto: PatchMatchDTO,
    ): Promise<MatchDTO | null> => {
        isLoading.value = true
        error.value = null
        try {
            const { data, error: fetchError } = await useFetch<MatchDTO>(
                `/api/match/${id}`,
                {
                    method: 'PATCH',
                    body: dto,
                    headers: useRequestHeaders(['cookie']),
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            const updatedMatch = data.value
            if (updatedMatch) {
                matches.value = matches.value.map((match) =>
                    match.id === id ? updatedMatch : match,
                )
                clearNuxtData('matches')
            }
            return updatedMatch || null
        } catch (err: any) {
            error.value = err
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Supprimer un match définitivement
     */
    const deleteMatch = async (id: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null
        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/match/${id}`,
                {
                    method: 'DELETE',
                    query: { hard: 'true' },
                    headers: useRequestHeaders(['cookie']),
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            matches.value = matches.value.filter((match) => match.id !== id)
            clearNuxtData('matches')
            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Suppression douce d'un match (soft delete)
     */
    const softDeleteMatch = async (id: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null
        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/match/${id}`,
                {
                    method: 'DELETE',
                    headers: useRequestHeaders(['cookie']),
                },
            )
            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }
            matches.value = matches.value.filter((match) => match.id !== id)
            clearNuxtData('matches')
            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Précharger les matches d'un utilisateur (pour SSR ou initialisation)
     */
    const preloadUserMatches = async (userId: string) => {
        if (!matches.value.length) {
            await fetchUserMatches(userId)
        }
        return matches.value
    }

    return {
        matches,
        currentMatch,
        isLoading,
        error,
        fetchUserMatches,
        fetchSpaceMatches,
        getMatchById,
        createMatch,
        updateMatch,
        deleteMatch,
        softDeleteMatch,
        preloadUserMatches,
    }
}
