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
    <div
        class="bg-surface-0 dark:bg-surface-900 border-t border-surface p-4 rounded-b-lg"
    >
        <form class="flex items-center gap-2" @submit.prevent="handleSubmit">
            <InputText
                v-model="message"
                type="text"
                :placeholder="placeholder"
                :disabled="disabled"
                maxlength="4000"
                class="flex-1 rounded-full"
            />
            <Button
                type="submit"
                icon="pi pi-send"
                rounded
                :loading="disabled"
                :disabled="!message.trim() || disabled"
                :aria-label="$t('chat.send')"
            />
        </form>
    </div>
</template>
