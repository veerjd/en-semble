<template>
    <div>
        <chat-component />
    </div>
</template>

<script setup>
import ChatComponent from '~/components/ChatComponent.vue'

// Redirect if not logged in
const user = useSupabaseUser()
const router = useRouter()

onMounted(() => {
    if (!user.value) {
        router.push('/login')
    }
})

watch(user, (newUser) => {
    if (!newUser) {
        router.push('/login')
    }
})
</script>
