<script setup>
import { ref, onMounted } from 'vue'
import useRequest from '../composables/useRequest.js'
import { fetchBestRestaurants } from '../services/api.js'
import SearchBar from './SearchBar.vue'
import RestaurantTable from './RestaurantTable.vue'

const search = ref('')
const { data, loading, error, load } = useRequest(
    () => fetchBestRestaurants({ search: search.value, limit: 50 }),
    { items: [], total: 0 },
)
onMounted(load)
</script>

<template>
    <section id="best" class="bg-midnight py-28 text-cream">
        <div class="mx-auto max-w-6xl px-6">
            <div class="grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
                <div>
                    <p class="text-xs font-bold uppercase tracking-[0.3em] text-primary">Best Quality</p>
                    <h2 class="mt-3 font-display text-4xl leading-tight md:text-6xl">
                        Top-Scoring Restaurants
                    </h2>
                </div>
                <p class="text-cream/85">
                    Restaurants whose
                    <span class="text-primary">aggregated inspection scores exceed 90</span>, ranked highest
                    first.
                </p>
            </div>
            <div class="mt-10">
                <SearchBar v-model="search" placeholder="Search by name" @submit="load" />
            </div>
            <p v-if="!error && !loading" class="mb-4 mt-10 text-sm text-cream/85">
                {{ data.total }} Restaurants Qualify
            </p>
            <p v-if="error" role="alert" class="mt-10">
                {{ error }} <button class="underline" @click="load">Retry</button>
            </p>
            <p v-else-if="loading" role="status" class="mt-10">Loading restaurants...</p>
            <RestaurantTable v-else :items="data.items" show-total dark />
        </div>
    </section>
</template>
