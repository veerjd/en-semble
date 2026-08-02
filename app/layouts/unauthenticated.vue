<template>
    <div class="relative min-h-screen w-full flex items-center justify-center">
        <div class="absolute top-4 right-4">
            <ColorModeToggle />
        </div>
        <slot />
        <Toast position="top-right" />
    </div>
</template>
