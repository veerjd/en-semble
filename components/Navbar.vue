<template>
    <div
        class="flex items-center justify-between w-full bg-surface-0 border-b border-surface-200 px-4 py-2"
    >
        <!-- Center: Navigation Items -->
        <div class="flex items-center gap-6">
            <Button
                v-for="item in items"
                :key="item.label"
                :label="item.label"
                :icon="item.icon"
                text
                @click="item.command"
                class="p-button-sm"
            />
        </div>

        <!-- Middle-Right: Space Switcher -->
        <div class="flex items-center">
            <!-- Always show dropdown, even if no spaces -->
            <Dropdown
                v-model="selectedSpaceId"
                :options="availableSpaces"
                optionLabel="name"
                optionValue="id"
                placeholder="Select Space"
                class="w-48"
                @change="onSpaceChange"
            >
                <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex items-center">
                        <i class="pi pi-building mr-2"></i>
                        <span>{{ getCurrentSpaceName(slotProps.value) }}</span>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-building mr-2"></i>
                        <span>{{ slotProps.option.name }}</span>
                    </div>
                </template>
            </Dropdown>

            <!-- Debug info -->
            <div v-if="isLoading" class="ml-2 text-sm text-gray-500">
                Loading spaces...
            </div>
            <div
                v-else-if="availableSpaces.length === 0"
                class="ml-2 text-sm text-gray-500"
            >
                No spaces found
            </div>
            <div v-else class="ml-2 text-sm text-gray-500">
                {{ availableSpaces.length }} spaces
            </div>
        </div>

        <!-- Right: User Menu -->
        <div class="flex items-center gap-4">
            <Button
                v-for="item in rightItems"
                :key="item.label"
                :label="item.label"
                :icon="item.icon"
                text
                size="small"
                @click="item.command"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'

const router = useRouter()
const {
    currentSpaceId,
    availableSpaces,
    switchSpace,
    initializeSpaceContext,
    isLoading,
} = useSpaceContext()

const selectedSpaceId = ref(currentSpaceId.value)

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const unreadMessages = ref(0)

const items = computed(() => {
    if (!user.value) {
        return []
    }

    return [
        {
            label: 'Chats',
            icon: 'pi pi-comments',
            badge: unreadMessages.value || undefined,
            command: () => {
                router.push('/')
            },
        },
    ]
})

const rightItems = computed(() => {
    const settingMenu = [
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
                router.push('/logout')
            },
        },
    ]

    if (user.value) {
        settingMenu.unshift({
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => {
                router.push('/profile')
            },
        })
    }

    return settingMenu
})

const getCurrentSpaceName = (spaceId) => {
    const space = availableSpaces.value.find((s) => s.id === spaceId)
    return space ? space.name : 'Unknown Space'
}

const onSpaceChange = async (event) => {
    const success = await switchSpace(event.value)
    if (!success) {
        selectedSpaceId.value = currentSpaceId.value
    }
}

onMounted(async () => {
    console.log('Navbar mounted, user:', user.value)
    await initializeSpaceContext()
    selectedSpaceId.value = currentSpaceId.value
    console.log(
        'After initialization - currentSpaceId:',
        currentSpaceId.value,
        'availableSpaces:',
        availableSpaces.value,
    )

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

// Watch for space changes from other components
if (process.client) {
    window.addEventListener('spaceChanged', (event) => {
        selectedSpaceId.value = event.detail.spaceId
    })
}
</script>
