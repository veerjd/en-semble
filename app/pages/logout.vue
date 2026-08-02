<script setup lang="ts">
definePageMeta({ layout: 'unauthenticated' })

const supabase = useSupabaseClient()

const { error } = await supabase.auth.signOut()

// Clear the cached profile so the next login starts fresh.
useState('me').value = null
</script>

<template>
    <div
        class="flex flex-col w-96 mx-auto p-8 dark:bg-slate-900 rounded-lg gap-6"
    >
        <h1 v-if="error" class="text-xl font-bold">{{ error.message }}</h1>
        <h1 v-else class="text-xl font-bold">{{ $t('auth.loggedOut') }}</h1>
        <Button
            type="button"
            :label="$t('auth.logBackIn')"
            class="w-full"
            @click="navigateTo('/login')"
        />
    </div>
</template>
