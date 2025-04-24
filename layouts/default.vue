<template>
    <div class="flex flex-col h-full w-full">
        <header class="bg-white shadow-sm dark:bg-slate-700 w-full">
            <div class="card">
                <Menubar
                    :model="menuItems"
                    :pt="{
                        root: {
                            class: 'border-0 border-b border-gray-600 bg-slate-200 dark:bg-slate-900 dark:text-white text-gray-900 rounded-none',
                        },
                    }"
                >
                    <template #start>
                        <svg
                            width="35"
                            height="40"
                            viewBox="0 0 35 40"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-8"
                        >
                            <path d="..." fill="var(--p-primary-color)" />
                            <path d="..." fill="var(--p-text-color)" />
                        </svg>
                    </template>
                    <template #item="{ item, props }">
                        <a
                            v-ripple
                            :class="[
                                'flex items-center gap-2',
                                { 'text-emphasis': item.url === $route.path },
                            ]"
                            v-bind="props.action"
                            :href="item.to"
                        >
                            <i :class="item.icon"></i>
                            <span>{{ item.label }}</span>
                        </a>
                    </template>
                    <template #end>
                        <div class="flex items-center justify-center gap-8">
                            <a
                                v-ripple
                                v-for="setting in settings"
                                :class="['flex items-center gap-2']"
                                :href="setting.to"
                            >
                                <i :class="setting.icon"></i>
                                <span>{{ setting.label }}</span>
                            </a>
                        </div>
                    </template>
                </Menubar>
            </div>
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
            label: 'Discover',
            icon: 'pi pi-compass',
            to: '/',
        },
        {
            label: 'Matches',
            icon: 'pi pi-users',
            to: '/matches',
            badge: unreadMessages.value ? unreadMessages.value : undefined,
            badgeClass: 'bg-red-500 text-white',
        },
        {
            label: 'User',
            icon: 'pi pi-user',
            to: '/user',
        },
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => logout(),
        },
    ]
})

const settings = [
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        url: '/logout',
    },
]

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
