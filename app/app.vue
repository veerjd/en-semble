<script setup lang="ts">
// Color scheme is managed by @nuxtjs/color-mode (class on <html>),
// consumed by Tailwind (darkMode: 'selector') and PrimeVue (.dark).
import './assets/globals.css'
</script>

<template>
    <div
        class="flex font-sans min-h-screen bg-surface-100 dark:bg-surface-950 text-color"
    >
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
