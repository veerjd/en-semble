<script setup lang="ts">
definePageMeta({ layout: 'unauthenticated' })

const { t } = useI18n()
const client = useSupabaseClient()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

const handleLogin = async () => {
    if (submitting.value) return
    submitting.value = true
    error.value = null
    try {
        const { error: authError } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        })
        if (authError) throw authError
        await navigateTo('/')
    } catch {
        error.value = t('auth.loginFailed')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="max-w-md w-full mx-auto p-8">
        <h1 class="text-3xl font-bold mb-8 text-center">
            {{ $t('auth.loginTitle') }}
        </h1>

        <form class="space-y-6" @submit.prevent="handleLogin">
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
                    autocomplete="current-password"
                    class="mt-1 block w-full"
                />
            </div>

            <Message v-if="error" severity="error">{{ error }}</Message>

            <Button
                type="submit"
                :label="$t('auth.loginButton')"
                :loading="submitting"
                class="w-full"
            />
        </form>

        <p class="mt-6 text-center text-sm text-muted-color">
            {{ $t('auth.inviteOnly') }}
        </p>
    </div>
</template>
