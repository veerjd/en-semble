<script setup lang="ts">
// The space middleware redirects authenticated users to /{space}/matches;
// @nuxtjs/supabase redirects unauthenticated visitors to /login.
</script>

<template>
    <div class="flex items-center justify-center min-h-[50vh]">
        <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" />
    </div>
</template>
