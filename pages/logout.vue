<script setup>
definePageMeta({
    layout: 'unauthenticated',
})

import { H1, Button } from '#components'

const supabase = useSupabaseClient()

const { error } = await supabase.auth.signOut()
</script>

<template>
    <div class="flex flex-col w-96 p-8 dark:bg-slate-900 rounded-lg gap-6">
        <h1 v-if="error" class="text-3xl font-bold mb-8">{{ error }}</h1>
        <h1 v-else>Disconnection successful!</h1>
        <Button
            color="primary"
            label="Log back in"
            @navigate="navigateTo('/login')"
        />
    </div>
</template>
