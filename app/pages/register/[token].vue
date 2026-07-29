<script setup lang="ts">
definePageMeta({ layout: 'unauthenticated' })

const route = useRoute()
const { t } = useI18n()
const client = useSupabaseClient()

const token = route.params.token as string

const email = ref('')
const password = ref('')
const username = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

const handleRegister = async () => {
    if (submitting.value) return
    submitting.value = true
    error.value = null
    try {
        await $fetch('/api/auth/register', {
            method: 'POST',
            body: {
                token,
                email: email.value,
                password: password.value,
                username: username.value,
            },
        })

        // The account exists and is confirmed; sign in with the same
        // credentials and land in the space.
        const { error: authError } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        })
        if (authError) throw authError
        await navigateTo('/')
    } catch (err) {
        error.value = t(`errors.${apiErrorCode(err)}`)
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="max-w-md w-full mx-auto p-8">
        <h1 class="text-3xl font-bold mb-8 text-center">
            {{ $t('auth.registerTitle') }}
        </h1>

        <form class="space-y-6" @submit.prevent="handleRegister">
            <div>
                <label for="username" class="font-medium">
                    {{ $t('auth.username') }}
                </label>
                <InputText
                    id="username"
                    v-model="username"
                    required
                    minlength="3"
                    maxlength="30"
                    autocomplete="username"
                    class="mt-1 block w-full"
                />
                <p class="mt-1 text-sm text-gray-400">
                    {{ $t('auth.usernameHint') }}
                </p>
            </div>

            <div>
                <label for="email" class="font-medium">
                    {{ $t('auth.email') }}
                </label>
                <InputText
                    id="email"
                    v-model="email"
                    type="email"
                    required
                    autocomplete="email"
                    class="mt-1 block w-full"
                />
            </div>

            <div>
                <label for="password" class="font-medium">
                    {{ $t('auth.password') }}
                </label>
                <InputText
                    id="password"
                    v-model="password"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    class="mt-1 block w-full"
                />
                <p class="mt-1 text-sm text-gray-400">
                    {{ $t('auth.passwordHint') }}
                </p>
            </div>

            <Message v-if="error" severity="error">{{ error }}</Message>

            <Button
                type="submit"
                :label="
                    submitting
                        ? $t('auth.registering')
                        : $t('auth.registerButton')
                "
                :loading="submitting"
                class="w-full"
            />
        </form>
    </div>
</template>
