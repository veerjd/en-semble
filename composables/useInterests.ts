export const useInterests = () => {
    const { data: cachedData } = useNuxtData('interests')

    if (!cachedData.value) {
        return useFetch('/api/interest', {
            headers: useRequestHeaders(['cookie']),
            key: 'interests',
        })
    } else {
        return {
            data: cachedData,
            error: ref(undefined),
            pending: false,
        }
    }
}
