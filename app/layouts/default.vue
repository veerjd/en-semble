<script setup lang="ts">
// Live match notifications for the whole authenticated app.
useRealtimeMatches()
</script>

<template>
    <div class="min-h-screen w-full flex flex-col">
        <header>
            <Navbar />
        </header>
        <main class="flex-1">
            <slot />
        </main>
        <Toast position="top-right" />
    </div>
</template>
