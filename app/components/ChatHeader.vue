<template>
    <div class="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div class="flex items-center">
            <button
                v-if="showBackButton"
                @click="$emit('back')"
                class="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
                <i class="pi pi-arrow-left text-gray-600"></i>
            </button>
            <div v-if="user" class="flex items-center">
                <div
                    class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                >
                    {{ user.username?.charAt(0).toUpperCase() }}
                </div>
                <div>
                    <h1 class="text-lg font-semibold text-gray-900">
                        {{ user.username }}
                    </h1>
                    <p class="text-sm text-gray-500">{{ status }}</p>
                </div>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <slot name="actions">
                <button class="p-2 hover:bg-gray-100 rounded-full">
                    <i class="pi pi-info-circle text-gray-600"></i>
                </button>
            </slot>
        </div>
    </div>
</template>

<script setup>
defineProps({
    user: {
        type: Object,
        default: null
    },
    status: {
        type: String,
        default: 'Active'
    },
    showBackButton: {
        type: Boolean,
        default: true
    }
})

defineEmits(['back'])
</script>