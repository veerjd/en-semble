<script setup lang="ts">
const { me } = useMe()

const spaceSlug = computed(() => me.value?.space.slug)
</script>

<template>
    <Toolbar
        class="rounded-none border-x-0 border-t-0 border-b border-surface px-6 py-2"
    >
        <template #start>
            <NuxtLink
                :to="spaceSlug ? `/${spaceSlug}/matches` : '/'"
                class="text-xl font-bold text-color"
            >
                En-Semble
                <span
                    v-if="me"
                    class="text-sm font-normal text-muted-color ml-2"
                >
                    {{ me.space.name }}
                </span>
            </NuxtLink>
        </template>

        <template #end>
            <div class="flex items-center gap-1">
                <template v-if="me">
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
                    <NuxtLink :to="`/${spaceSlug}/invite`">
                        <Button
                            :label="$t('nav.invite')"
                            icon="pi pi-user-plus"
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
                </template>
                <ColorModeToggle />
            </div>
        </template>
    </Toolbar>
</template>
