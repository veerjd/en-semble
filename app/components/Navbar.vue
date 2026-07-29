<script setup lang="ts">
const { me } = useMe()

const spaceSlug = computed(() => me.value?.space.slug)
</script>

<template>
    <nav
        class="flex items-center justify-between px-6 py-3 bg-slate-900 text-white"
    >
        <NuxtLink
            :to="spaceSlug ? `/${spaceSlug}/matches` : '/'"
            class="text-xl font-bold"
        >
            En-Semble
            <span v-if="me" class="text-sm font-normal text-gray-400 ml-2">
                {{ me.space.name }}
            </span>
        </NuxtLink>

        <div v-if="me" class="flex items-center gap-2">
            <NuxtLink :to="`/${spaceSlug}/matches`">
                <Button
                    :label="$t('nav.matches')"
                    icon="pi pi-users"
                    text
                    severity="secondary"
                />
            </NuxtLink>
            <NuxtLink :to="`/${spaceSlug}/profile`">
                <Button
                    :label="$t('nav.profile')"
                    icon="pi pi-user"
                    text
                    severity="secondary"
                />
            </NuxtLink>
            <NuxtLink to="/logout">
                <Button
                    :label="$t('nav.logout')"
                    icon="pi pi-sign-out"
                    text
                    severity="secondary"
                />
            </NuxtLink>
        </div>
    </nav>
</template>
