<script setup>
import { useId } from 'vue'

const searchId = useId()
const model = defineModel({ type: String, default: '' })
defineProps({ placeholder: { type: String, default: 'Search…' } })
const emit = defineEmits(['submit'])
</script>

<template>
    <form
        class="flex w-full max-w-xl overflow-hidden rounded-full border border-stone/30 bg-paper text-ink focus-within:border-primary-deep focus-within:ring-2 focus-within:ring-primary-deep/20"
        @submit.prevent="emit('submit')"
    >
        <label class="sr-only" :for="searchId">Search keyword</label>
        <input
            :id="searchId"
            v-model="model"
            :placeholder="placeholder"
            class="min-w-0 flex-1 bg-transparent px-6 py-3 outline-none placeholder:text-stone"
        />
        <button
            type="submit"
            class="m-1 rounded-full bg-midnight px-6 font-semibold text-cream transition-colors duration-200 hover:bg-primary hover:text-midnight"
        >
            Find
        </button>
    </form>
</template>
