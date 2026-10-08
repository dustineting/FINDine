<script setup>
import { ref, watch, onMounted } from 'vue'
import { fetchRestaurants, fetchBoroughs } from '../services/api.js'
import useRequest from '../composables/useRequest.js'
import SearchBar from './SearchBar.vue'
import RestaurantTable from './RestaurantTable.vue'

const search = ref('')
const borough = ref('')
const page = ref(1)
const { data, loading, error, load } = useRequest(
    () => fetchRestaurants({ search: search.value, borough: borough.value, page: page.value, limit: 15 }),
    { items: [], total: 0, pages: 0 },
)
const {
    data: boroughs,
    error: boroughError,
    loading: boroughLoading,
    load: loadBoroughs,
} = useRequest(fetchBoroughs, [])

function submit() {
    page.value === 1 ? load() : (page.value = 1)
}
function pickBorough(value) {
    borough.value = borough.value === value ? '' : value
}
watch(borough, submit)
watch(page, load)
onMounted(() => {
    load()
    loadBoroughs()
})
</script>

<template>
    <section id="restaurants" class="bg-white/60 py-28">
        <div class="mx-auto max-w-6xl px-6">
            <div class="text-center">
                <p class="text-xs font-bold uppercase tracking-[0.3em] text-olive">Directory</p>
                <h2 class="mt-3 font-display text-4xl text-forest md:text-5xl">Check some restaurants</h2>
                <p class="mt-3 text-charcoal/65">
                    Search by restaurant name or cuisine, then narrow down by borough.
                </p>
            </div>

            <div class="mt-12 flex flex-col items-center gap-5">
                <SearchBar v-model="search" placeholder="Try “Starbucks” or “Bakery”" @submit="submit" />
                <div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by borough">
                    <button
                        class="rounded-full border px-4 py-1.5 text-sm transition"
                        :class="
                            !borough
                                ? 'border-forest bg-forest text-cream'
                                : 'border-olive/30 text-olive hover:border-forest'
                        "
                        @click="borough = ''"
                    >
                        All boroughs
                    </button>
                    <button
                        v-for="b in boroughs"
                        :key="b"
                        class="rounded-full border px-4 py-1.5 text-sm transition"
                        :class="
                            borough === b
                                ? 'border-gold bg-gold text-charcoal'
                                : 'border-olive/30 text-olive hover:border-forest'
                        "
                        @click="pickBorough(b)"
                    >
                        {{ b }}
                    </button>
                </div>
                <p v-if="boroughError" role="alert" class="text-sm text-forest">
                    {{ boroughError }} <button class="underline" @click="loadBoroughs">Retry boroughs</button>
                </p>
                <p v-else-if="boroughLoading" role="status" class="text-sm text-olive">Loading boroughs...</p>
            </div>

            <div
                v-if="!error && !loading"
                class="mb-4 mt-12 flex items-center justify-between text-sm text-olive"
            >
                <span
                    ><strong class="text-forest">{{ data.total.toLocaleString() }}</strong> restaurants
                    found</span
                >
            </div>
            <p v-if="error" role="alert" class="mt-8 text-forest">
                {{ error }} <button class="underline" @click="load">Retry</button>
            </p>
            <p v-else-if="loading" role="status" class="mt-8 text-olive">Loading restaurants...</p>
            <RestaurantTable v-else :items="data.items" />

            <div
                v-if="!error && !loading && data.pages > 1"
                class="mt-8 flex items-center justify-center gap-4 text-sm"
            >
                <button
                    :disabled="page <= 1"
                    class="rounded-full border border-olive/30 px-4 py-2 disabled:opacity-30"
                    @click="page--"
                >
                    ← Prev
                </button>
                <span class="text-olive">Page {{ page }} of {{ data.pages }}</span>
                <button
                    :disabled="page >= data.pages"
                    class="rounded-full border border-olive/30 px-4 py-2 disabled:opacity-30"
                    @click="page++"
                >
                    Next →
                </button>
            </div>
        </div>
    </section>
</template>
