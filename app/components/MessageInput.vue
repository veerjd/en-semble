<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        placeholder?: string
        disabled?: boolean
    }>(),
    { placeholder: '', disabled: false },
)

const emit = defineEmits<{ send: [content: string] }>()

const message = ref('')

const handleSubmit = () => {
    if (!message.value.trim() || props.disabled) return
    emit('send', message.value.trim())
    message.value = ''
}

defineExpose({
    setMessage: (value: string) => {
        message.value = value
    },
})
</script>

<template>
    <div class="bg-white border-t border-gray-200 p-4 rounded-b-lg">
        <form
            class="flex items-center space-x-2"
            @submit.prevent="handleSubmit"
        >
            <input
                v-model="message"
                type="text"
                :placeholder="placeholder"
                :disabled="disabled"
                maxlength="4000"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
                type="submit"
                :disabled="!message.trim() || disabled"
                class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i v-if="disabled" class="pi pi-spinner pi-spin" />
                <i v-else class="pi pi-send" />
            </button>
        </form>
    </div>
</template>
