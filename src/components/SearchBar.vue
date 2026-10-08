<script setup>
import { useId } from 'vue'

const searchId = useId()
const model = defineModel({ type: String, default: '' })
defineProps({ placeholder: { type: String, default: 'Search…' } })
const emit = defineEmits(['submit'])
</script>

<template>
    <form
        class="flex w-full max-w-xl overflow-hidden rounded-full border border-olive/30 bg-white focus-within:border-gold"
        @submit.prevent="emit('submit')"
    >
        <label class="sr-only" :for="searchId">Search keyword</label>
        <input
            :id="searchId"
            v-model="model"
            :placeholder="placeholder"
            class="flex-1 bg-transparent px-6 py-3 outline-none placeholder:text-olive/60"
        />
        <button
            type="submit"
            class="m-1 rounded-full bg-forest px-6 font-bold text-cream transition hover:bg-olive"
        >
            Find
        </button>
    </form>
</template>
