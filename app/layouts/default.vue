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
