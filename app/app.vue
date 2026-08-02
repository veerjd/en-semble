<script setup lang="ts">
// Color scheme is managed by @nuxtjs/color-mode (class on <html>),
// consumed by Tailwind (darkMode: 'selector') and PrimeVue (.dark).
import './assets/globals.css'
</script>

<template>
    <div
        class="flex font-sans min-h-screen bg-slate-200 dark:bg-slate-800 dark:text-white text-gray-900"
    >
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
