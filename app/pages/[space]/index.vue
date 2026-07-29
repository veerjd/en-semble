<script setup lang="ts">
const route = useRoute()

await navigateTo(`/${route.params.space}/matches`, { replace: true })
</script>

<template>
    <div />
</template>
