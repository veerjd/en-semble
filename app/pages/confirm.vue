<script setup lang="ts">
definePageMeta({ layout: 'unauthenticated' })

const user = useSupabaseUser()

// Get redirect path from cookies
const cookieName = useRuntimeConfig().public.supabase.cookieName
const redirectPath = useCookie(`${cookieName}-redirect-path`).value

watch(
    user,
    () => {
        if (user.value) {
            // Clear cookie and continue where the user was headed.
            useCookie(`${cookieName}-redirect-path`).value = null
            return navigateTo(redirectPath ?? '/')
        }
    },
    { immediate: true },
)
</script>

<template>
    <div>{{ $t('auth.waitingForLogin') }}</div>
</template>
