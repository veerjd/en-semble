<script setup lang="ts">
// @nuxtjs/color-mode puts .dark / .light on <html>; Tailwind
// (darkMode: 'selector') and PrimeVue (darkModeSelector: '.dark') both key
// off it, so flipping the preference restyles everything at once.
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggle = () => {
    colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
    <!-- The resolved mode is only known client-side (it may come from the
         OS preference), so render the real icon after hydration. -->
    <ClientOnly>
        <Button
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            :aria-label="$t('nav.toggleTheme')"
            text
            rounded
            severity="secondary"
            @click="toggle"
        />
        <template #fallback>
            <Button
                icon="pi pi-moon"
                :aria-label="$t('nav.toggleTheme')"
                text
                rounded
                severity="secondary"
                disabled
            />
        </template>
    </ClientOnly>
</template>
