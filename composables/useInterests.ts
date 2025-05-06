import type {
    InterestDTO,
    PostInterestDTO,
    PatchInterestDTO,
    DeleteInterestDTO,
    SoftDeleteInterestDTO,
} from '~/shared/types/InterestDTOs'
import type { UserInterestDTO } from '~/shared/types/UserInterestDTOs'

export const useInterests = () => {
    const interests: Ref<InterestDTO[]> = ref([])
    const currentInterest: Ref<InterestDTO | null> = ref(null)
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    // User-interest assignments
    const userInterests: Ref<Record<string, string[]>> = ref({})

    /**
     * Fetch all interests from the database
     */
    const fetchAllInterests = async (): Promise<InterestDTO[]> => {
        isLoading.value = true
        error.value = null

        // First check if we have cached data
        const { data: cachedData } = useNuxtData('interests')

        if (cachedData.value?.length > 0) {
            interests.value = cachedData.value
            isLoading.value = false
            return cachedData.value
        }

        try {
            // Otherwise fetch from API
            const { data, error: fetchError } = await useFetch<InterestDTO[]>(
                '/api/interest',
                {
                    headers: useRequestHeaders(['cookie']),
                    key: 'interests',
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            interests.value = data.value || []
            return interests.value
        } catch (err: any) {
            error.value = err
            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Get a single interest by ID
     */
    const getInterestById = async (id: string): Promise<InterestDTO | null> => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await useFetch<InterestDTO>(
                `/api/interest/${id}`,
                {
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            currentInterest.value = data.value || null
            return currentInterest.value
        } catch (err: any) {
            error.value = err
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Create a new interest
     */
    const createInterest = async (
        dto: PostInterestDTO,
    ): Promise<InterestDTO | null> => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await useFetch<InterestDTO>(
                '/api/interest',
                {
                    method: 'POST',
                    body: dto,
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update the local cache
            const newInterest = data.value
            if (newInterest) {
                interests.value = [...interests.value, newInterest]
                // Invalidate the interests cache to ensure fresh data on next fetch
                clearNuxtData('interests')
            }

            return newInterest || null
        } catch (err: any) {
            error.value = err
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Update an existing interest
     */
    const updateInterest = async (
        id: string,
        dto: PatchInterestDTO,
    ): Promise<InterestDTO | null> => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await useFetch<InterestDTO>(
                `/api/interest/${id}`,
                {
                    method: 'PATCH',
                    body: dto,
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update the local cache
            const updatedInterest = data.value
            if (updatedInterest) {
                interests.value = interests.value.map((interest) =>
                    interest.id === id ? updatedInterest : interest,
                )
                // Invalidate the interests cache
                clearNuxtData('interests')
            }

            return updatedInterest || null
        } catch (err: any) {
            error.value = err
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Delete an interest permanently
     */
    const deleteInterest = async (id: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/interest/${id}`,
                {
                    method: 'DELETE',
                    query: { hard: 'true' },
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update the local cache
            interests.value = interests.value.filter(
                (interest) => interest.id !== id,
            )

            // Also remove from any user assignments
            for (const userId in userInterests.value) {
                userInterests.value[userId] = userInterests.value[
                    userId
                ].filter((interestId) => interestId !== id)
            }

            // Invalidate the interests cache
            clearNuxtData('interests')

            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Soft delete an interest (mark as deleted but keep in database)
     */
    const softDeleteInterest = async (id: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/interest/${id}`,
                {
                    method: 'DELETE',
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update the local cache (remove from UI but don't actually delete the data)
            interests.value = interests.value.filter(
                (interest) => interest.id !== id,
            )

            // Invalidate the interests cache
            clearNuxtData('interests')

            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Assign an interest to a user
     */
    const assignInterestToUser = async (
        userId: string,
        interestId: string,
    ): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/user/${userId}/interests`,
                {
                    method: 'POST',
                    body: { interest_id: interestId },
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update local state
            if (!userInterests.value[userId]) {
                userInterests.value[userId] = []
            }

            if (!userInterests.value[userId].includes(interestId)) {
                userInterests.value[userId].push(interestId)
            }

            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Remove an interest from a user
     */
    const removeInterestFromUser = async (
        userId: string,
        interestId: string,
    ): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/user/${userId}/interests/${interestId}`,
                {
                    method: 'DELETE',
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update local state
            if (userInterests.value[userId]) {
                userInterests.value[userId] = userInterests.value[
                    userId
                ].filter((id) => id !== interestId)
            }

            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Replace all user interests with new ones
     */
    const replaceUserInterests = async (
        userId: string,
        interestIds: string[],
    ): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            const { error: fetchError } = await useFetch<{ success: boolean }>(
                `/api/user/${userId}/interests/replace`,
                {
                    method: 'POST',
                    body: { interestIds },
                    headers: useRequestHeaders(['cookie']),
                },
            )

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            // Update local state
            userInterests.value[userId] = [...interestIds]

            return true
        } catch (err: any) {
            error.value = err
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Remove all interests from a user
     */
    const removeAllInterestsFromUser = async (
        userId: string,
    ): Promise<boolean> => {
        return await replaceUserInterests(userId, [])
    }

    /**
     * Fetch all interests for a specific user
     */
    const fetchUserInterests = async (
        userId: string,
    ): Promise<InterestDTO[]> => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await useFetch<
                UserInterestDTO[]
            >(`/api/user/${userId}/interests`, {
                headers: useRequestHeaders(['cookie']),
            })

            if (fetchError.value) {
                throw new Error(fetchError.value.message)
            }

            const userInterestData = data.value || []

            // Update local state
            userInterests.value[userId] = userInterestData.map(
                (interest) => interest.interest_id,
            )

            // If interests are already loaded, filter them rather than making individual requests
            if (interests.value.length > 0) {
                return interests.value.filter((interest) =>
                    userInterests.value[userId].includes(interest.id),
                )
            }

            // Otherwise fetch each interest individually
            const fullInterests: InterestDTO[] = []
            for (const interestData of userInterestData) {
                const interest = await getInterestById(interestData.interest_id)
                if (interest) {
                    fullInterests.push(interest)
                }
            }

            return fullInterests
        } catch (err: any) {
            error.value = err
            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Get interests for a specific user from local state
     */
    const getUserInterests = (userId: string): InterestDTO[] => {
        if (!userInterests.value[userId]) return []

        return interests.value.filter((interest) =>
            userInterests.value[userId].includes(interest.id),
        )
    }

    // Preload interests when the composable is used
    const preloadInterests = async () => {
        if (!interests.value.length) {
            await fetchAllInterests()
        }
        return interests.value
    }

    // Initialize by fetching all interests
    let initialized = false

    onMounted(() => {
        if (!initialized) {
            preloadInterests()
            initialized = true
        }
    })

    return {
        // State
        interests,
        currentInterest,
        isLoading,
        error,

        // Methods
        fetchAllInterests,
        getInterestById,
        createInterest,
        updateInterest,
        deleteInterest,
        softDeleteInterest,
        assignInterestToUser,
        removeInterestFromUser,
        removeAllInterestsFromUser,
        replaceUserInterests,
        fetchUserInterests,
        getUserInterests,
        preloadInterests,
    }
}
