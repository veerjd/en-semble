<template>
    <Menubar :model="items">
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
        <template #item="{ item, props, hasSubmenu, root }">
            <a v-ripple class="flex items-center" v-bind="props.action">
                <span>{{ item.label }}</span>
                <Badge
                    v-if="item.badge"
                    :class="{ 'ml-auto': !root, 'ml-2': root }"
                    :value="item.badge"
                />
                <span
                    v-if="item.shortcut"
                    class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1"
                    >{{ item.shortcut }}</span
                >
                <i
                    v-if="hasSubmenu"
                    :class="[
                        'pi pi-angle-down ml-auto',
                        { 'pi-angle-down': root, 'pi-angle-right': !root },
                    ]"
                ></i>
            </a>
        </template>
        <template #end>
            <div class="flex items-center gap-2">
                <InputText
                    placeholder="Search"
                    type="text"
                    class="w-32 sm:w-auto"
                />
                <Avatar image="/images/avatar/amyelsner.png" shape="circle" />
            </div>
        </template>
    </Menubar>
</template>

<script setup>
const router = useRouter()

const items = [
    {
        label: 'Home',
        icon: 'pi pi-home',
        command: () => {
            router.push('/')
        },
    },
    {
        label: 'About',
        icon: 'pi pi-info',
        command: () => {
            router.push('/about')
        },
    },
    {
        label: 'Contact',
        icon: 'pi pi-envelope',
        command: () => {
            router.push('/contact')
        },
    },
]
</script>
