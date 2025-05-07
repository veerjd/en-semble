// composables/useUser.ts
import { ref } from 'vue'
import type {
    UserDTO,
    PostUserDTO,
    PatchUserDTO,
    DeleteUserDTO,
    SoftDeleteUserDTO,
} from '~/shared/types/UserDTOs'

export function useUser() {
    const user = ref<UserDTO | null>(null)
    const loading = ref(false)
    const error = ref<any>(null)

    const fetchUser = async () => {
        loading.value = true
        try {
            const { data } = await useFetch<UserDTO>('/api/user/me', {
                key: 'me',
            })
            user.value = data.value || null
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const createUser = async (payload: PostUserDTO) => {
        loading.value = true
        try {
            await $fetch('/api/user', {
                method: 'POST',
                body: payload,
            })
            await fetchUser()
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const updateUser = async (payload: PatchUserDTO) => {
        loading.value = true
        try {
            await $fetch(`/api/user/${payload.id}`, {
                method: 'PATCH',
                body: payload,
            } as any)
            await fetchUser()
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const deleteUser = async (id: string) => {
        loading.value = true
        try {
            const payload: DeleteUserDTO = { id }
            await $fetch(`/api/user/${id}`, {
                method: 'DELETE',
                body: payload,
            } as any)
            await fetchUser()
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const softDeleteUser = async (id: string) => {
        loading.value = true
        try {
            const payload: SoftDeleteUserDTO = {
                id,
                deleted_at: new Date().toISOString(),
            }
            // Pour ce problème de typage dans Nuxt 3, assurez-vous de créer le fichier
            // /server/api/user/[id]/soft-delete.patch.ts pour que TypeScript reconnaisse cette méthode
            await $fetch(`/api/user/${id}/soft-delete`, {
                method: 'PATCH',
                body: payload,
            } as any)
            await fetchUser()
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    return {
        user,
        loading,
        error,
        fetchUser,
        createUser,
        updateUser,
        deleteUser,
        softDeleteUser,
    }
}
