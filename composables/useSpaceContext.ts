// composables/useSpaceContext.ts
import { ref, computed } from 'vue'
import type { SpaceDTO, PostSpaceDTO } from '~/shared/types/SpaceDTOs'

interface SpaceContextState {
    currentSpaceId: string | null
    availableSpaces: SpaceDTO[]
    isLoading: boolean
    error: any
}

const state = ref<SpaceContextState>({
    currentSpaceId: null,
    availableSpaces: [],
    isLoading: false,
    error: null,
})

export function useSpaceContext() {
    const currentSpace = computed(
        () =>
            state.value.availableSpaces.find(
                (space) => space.id === state.value.currentSpaceId,
            ) || null,
    )

    const fetchUserSpaces = async () => {
        console.log('fetchUserSpaces called')
        state.value.isLoading = true
        state.value.error = null

        try {
            // Use $fetch for client-side only to avoid SSR auth issues
            const data = await $fetch<SpaceDTO[]>('/api/user/spaces')
            
            console.log('$fetch result - data:', data)

            state.value.availableSpaces = data || []
            console.log('Set availableSpaces to:', state.value.availableSpaces)

            // If no current space is set and user has spaces, set the first one as default
            if (
                !state.value.currentSpaceId &&
                state.value.availableSpaces.length > 0
            ) {
                state.value.currentSpaceId = state.value.availableSpaces[0].id
                console.log('Set currentSpaceId to:', state.value.currentSpaceId)
            }
        } catch (err) {
            state.value.error = err
            console.error('Failed to fetch user spaces:', err)
        } finally {
            state.value.isLoading = false
        }
    }

    const switchSpace = async (spaceId: string) => {
        const space = state.value.availableSpaces.find((s) => s.id === spaceId)
        if (!space) {
            console.error('Space not found:', spaceId)
            return false
        }

        state.value.currentSpaceId = spaceId

        // Store in localStorage for persistence
        if (process.client) {
            localStorage.setItem('selectedSpaceId', spaceId)
        }

        // Emit space change event for other components to react
        if (process.client) {
            window.dispatchEvent(
                new CustomEvent('spaceChanged', {
                    detail: { spaceId, space },
                }),
            )
        }

        return true
    }

    const initializeSpaceContext = async () => {
        console.log('initializeSpaceContext called')
        
        // Try to restore from localStorage first
        if (process.client) {
            const storedSpaceId = localStorage.getItem('selectedSpaceId')
            if (storedSpaceId) {
                state.value.currentSpaceId = storedSpaceId
                console.log('Restored currentSpaceId from localStorage:', storedSpaceId)
            }
        }

        // Only fetch spaces if we're on the client side
        if (process.client) {
            await fetchUserSpaces()
        }
    }

    const createSpace = async (spaceData: PostSpaceDTO) => {
        state.value.isLoading = true
        state.value.error = null

        try {
            const data = await $fetch<SpaceDTO>('/api/spaces', {
                method: 'POST',
                body: spaceData,
            })

            state.value.availableSpaces.push(data)

            // Auto-switch to newly created space
            await switchSpace(data.id)

            return data
        } catch (err) {
            state.value.error = err
            console.error('Failed to create space:', err)
            throw err
        } finally {
            state.value.isLoading = false
        }
    }

    return {
        // State
        currentSpace,
        currentSpaceId: computed(() => state.value.currentSpaceId),
        availableSpaces: computed(() => state.value.availableSpaces),
        isLoading: computed(() => state.value.isLoading),
        error: computed(() => state.value.error),

        // Actions
        fetchUserSpaces,
        switchSpace,
        initializeSpaceContext,
        createSpace,
    }
}
