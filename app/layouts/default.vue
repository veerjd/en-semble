<template>
    <div class="flex flex-col min-h-screen w-full">
        <header class="bg-white shadow-sm dark:bg-slate-700 w-full">
            <Navbar />
        </header>

        <main class="flex-grow p-4 h-auto w-full">
            <slot />
        </main>

        <footer
            class="bg-white py-4 pe-4 text-right text-gray-500 text-sm border-t dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600 w-full"
        >
            &copy; {{ new Date().getFullYear() }} En-Semble. All rights
            reserved.
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const unreadMessages = ref(0)

const menuItems = computed(() => {
    if (!user.value) {
        return []
    }

    return [
        {
            label: 'Chats',
            icon: 'pi pi-comments',
            to: '/',
            badge: unreadMessages.value ? unreadMessages.value : undefined,
            badgeClass: 'bg-red-500 text-white',
        },
        {
            label: 'Find a new match',
            icon: 'pi pi-user-plus',
            to: '/new-match',
        },
    ]
})

const settings = computed(() => {
    const settingMenu = [
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            to: '/logout',
        },
    ]

    if (!user.value) {
        return settingMenu
    } else {
        settingMenu.unshift({
            label: `${user.value.email}`,
            icon: 'pi pi-user',
            to: '/profile',
        })
        return settingMenu
    }
})

onMounted(() => {
    if (user.value) {
        loadUnreadCount()
        setupRealtimeSubscription()
    }
})

onUnmounted(() => {
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

<style scoped>
/* Override PrimeVue menubar background */
:deep(.p-menubar) {
    background: transparent;
    padding: 0.5rem 0;
    width: 100%;
}

/* Ensure menu items match your theme */
:deep(.p-menuitem-link) {
    color: #4b5563 !important; /* text-gray-700 */
}

:deep(.p-menuitem-link:hover) {
    color: #2563eb !important; /* text-blue-600 */
    background: transparent !important;
}

:deep(.p-menuitem-link .p-menuitem-text) {
    color: inherit;
}

:deep(.p-menuitem-link .p-menuitem-icon) {
    color: inherit;
}

/* Dark mode overrides */
.dark :deep(.p-menubar) {
    background: transparent;
}

.dark :deep(.p-menuitem-link) {
    color: #cbd5e1 !important; /* dark:text-gray-300 */
}

.dark :deep(.p-menuitem-link:hover) {
    color: #60a5fa !important; /* dark:text-blue-400 */
}

.dark :deep(.p-menuitem-link .p-badge) {
    background: #ef4444; /* bg-red-500 */
}
</style>
