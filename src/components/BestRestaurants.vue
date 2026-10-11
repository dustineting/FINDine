<script setup>
import { ref, watch, onMounted } from 'vue'
import useRequest from '../composables/useRequest.js'
import { fetchBestRestaurants } from '../services/api.js'
import SearchBar from './SearchBar.vue'
import RestaurantTable from './RestaurantTable.vue'

const search = ref('')
const resultVersion = ref(0)
const { data, loading, error, load } = useRequest(
    () => fetchBestRestaurants({ search: search.value, limit: 50 }),
    { items: [], total: 0 },
)
watch(data, () => resultVersion.value++)
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
                <p class="text-cream/85 md:text-right">
                    Restaurants whose
                    <span class="text-primary">aggregated inspection scores exceed 90</span>, ranked highest
                    first.
                </p>
            </div>
            <div class="mt-10">
                <SearchBar v-model="search" placeholder="Search by Restaurant Name" @submit="load" />
            </div>
            <p v-if="!error && resultVersion" class="mb-4 mt-10 text-sm text-cream/85">
                {{ data.total }} Restaurants Qualify
            </p>
            <div class="relative" :aria-busy="loading">
                <p role="status" class="sr-only">{{ loading ? 'Loading restaurants...' : '' }}</p>
                <div
                    class="results-transition grid transition-opacity duration-200"
                    :class="{ 'opacity-50': loading && resultVersion }"
                >
                    <Transition name="results-transition">
                        <p v-if="error" key="error" role="alert" class="mt-10">
                            {{ error }} <button class="underline" @click="load">Retry</button>
                        </p>
                        <RestaurantTable
                            v-else-if="resultVersion"
                            :key="resultVersion"
                            :items="data.items"
                            show-total
                            dark
                        />
                        <p v-else key="loading" class="mt-10 min-h-80">Loading restaurants...</p>
                    </Transition>
                </div>
            </div>
        </div>
    </section>
</template>
