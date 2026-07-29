<template>
    <div class="bg-white border-t border-gray-200 p-4">
        <form @submit.prevent="handleSubmit" class="flex items-center space-x-2">
            <div class="flex-1 relative">
                <input
                    v-model="message"
                    type="text"
                    :placeholder="placeholder"
                    class="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="disabled"
                />
            </div>
            <button
                type="submit"
                :disabled="!message.trim() || disabled"
                class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i v-if="disabled" class="pi pi-spinner pi-spin"></i>
                <i v-else class="pi pi-send"></i>
            </button>
        </form>
    </div>
</template>

<script setup>
const props = defineProps({
    placeholder: {
        type: String,
        default: 'Type a message...'
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['send'])

const message = ref('')

const handleSubmit = () => {
    if (!message.value.trim() || props.disabled) return
    
    emit('send', message.value.trim())
    message.value = ''
}

// Expose the message value for parent access (e.g., for error recovery)
defineExpose({
    setMessage: (value) => {
        message.value = value
    }
})
</script>