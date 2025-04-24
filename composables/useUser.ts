export const useUser = () => {
    const { data: cachedData } = useNuxtData('user')

    if (!cachedData.value) {
        return useFetch('/api/user/me', {
            headers: useRequestHeaders(['cookie']),
            key: 'user',
        })
    } else {
        return {
            data: cachedData,
            error: ref(undefined),
            pending: false,
        }
    }
}
