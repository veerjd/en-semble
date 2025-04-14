<template>
    <div class="flex flex-col min-h-screen">
        <header class="bg-white shadow-sm dark:bg-slate-700">
            <div
                class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center"
            >
                <NuxtLink
                    to="/"
                    class="text-2xl font-bold text-blue-600 dark:text-blue-400"
                >
                    Interest Matcher
                </NuxtLink>

                <nav v-if="user" class="flex items-center space-x-6">
                    <NuxtLink
                        to="/"
                        class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                        active-class="text-blue-600 dark:text-blue-400"
                    >
                        Discover
                    </NuxtLink>
                    <NuxtLink
                        to="/matches"
                        class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 relative"
                        active-class="text-blue-600 dark:text-blue-400"
                    >
                        Matches
                        <span
                            v-if="unreadMessages > 0"
                            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            {{ unreadMessages }}
                        </span>
                    </NuxtLink>
                    <NuxtLink
                        to="/user"
                        class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                        active-class="text-blue-600 dark:text-blue-400"
                    >
                        User
                    </NuxtLink>
                    <button
                        @click="logout"
                        class="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                    >
                        Logout
                    </button>
                </nav>

                <div v-else class="flex gap-4">
                    <NuxtLink
                        to="/login"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Login / Sign Up
                    </NuxtLink>
                </div>
            </div>
        </header>

        <main class="flex-grow p-4">
            <slot />
        </main>

        <footer
            class="bg-white py-4 text-center text-gray-500 text-sm border-t dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600"
        >
            &copy; {{ new Date().getFullYear() }} Interest Matcher. All rights
            reserved.
        </footer>
    </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const unreadMessages = ref(0)

onMounted(() => {
    if (user.value) {
        loadUnreadCount()
        setupRealtimeSubscription()
    }
})

onUnmounted(() => {
    const supabase = useSupabaseClient()
    supabase.removeAllChannels()
})

watch(user, (newUser) => {
    if (newUser) {
        loadUnreadCount()
        setupRealtimeSubscription()
    } else {
        unreadMessages.value = 0
    }
})

const loadUnreadCount = async () => {
    if (!user.value) return

    try {
        const { data } = await supabase
            .from('messages')
            .select('id')
            .not('user_id', 'eq', user.value.id)
            .eq('read', false)

        unreadMessages.value = data ? data.length : 0
    } catch (error) {
        console.error('Error loading unread count:', error)
    }
}

const setupRealtimeSubscription = () => {
    if (!user.value) return

    supabase
        .channel('unread-messages')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `user_id.neq.${user.value.id}`,
            },
            async () => {
                await loadUnreadCount()
            },
        )
        .subscribe()
}

const logout = async () => {
    try {
        await supabase.auth.signOut()
        navigateTo('/login')
    } catch (error) {
        console.error('Error logging out:', error)
    }
}
</script>
