<script setup lang="ts">
definePageMeta({ layout: 'unauthenticated' })

// The session appears synchronously on SIGNED_IN (useSupabaseUser fills in
// later, after an async getClaims call), so watch the session to leave this
// page as soon as auth completes.
const session = useSupabaseSession()

// useSupabaseCookieRedirect reads the same cookie the auth guard writes
// (saveRedirectToCookie stores it under the configured cookie prefix).
const redirect = useSupabaseCookieRedirect()

watch(
    session,
    () => {
        if (session.value) {
            // Clear cookie and continue where the user was headed.
            return navigateTo(redirect.pluck() ?? '/')
        }
    },
    { immediate: true },
)
</script>

<template>
    <div>{{ $t('auth.waitingForLogin') }}</div>
</template>
