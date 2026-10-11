<script setup>
import { ref, watch, onMounted } from 'vue'
import { fetchRestaurants, fetchBoroughs } from '../services/api.js'
import useRequest from '../composables/useRequest.js'
import SearchBar from './SearchBar.vue'
import RestaurantTable from './RestaurantTable.vue'

const search = ref('')
const borough = ref('')
const page = ref(1)
const resultVersion = ref(0)
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

watch(data, () => resultVersion.value++)

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
    <section id="restaurants" class="bg-paper py-28">
        <div class="mx-auto max-w-6xl px-6">
            <div class="text-center">
                <p class="text-xs font-bold uppercase tracking-[0.3em] text-stone">Directory</p>
                <h2 class="mt-3 font-display text-4xl text-midnight md:text-5xl">The Restaurants</h2>
                <p class="mt-3 text-ink/65">
                    Search by restaurant name or cuisine, then narrow down by borough.
                </p>
            </div>

            <div class="mt-12 flex flex-col items-center gap-5">
                <SearchBar v-model="search" placeholder="Try “Starbucks” or “Bakery”" @submit="submit" />
                <div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by borough">
                    <button
                        class="rounded-full border px-4 py-1.5 text-sm transition-colors duration-200"
                        :class="
                            !borough
                                ? 'border-midnight bg-midnight text-cream'
                                : 'border-stone/30 text-stone hover:border-primary-deep hover:bg-primary/10 hover:text-midnight'
                        "
                        @click="borough = ''"
                        :aria-pressed="!borough"
                    >
                        All Boroughs
                    </button>
                    <button
                        v-for="b in boroughs"
                        :key="b"
                        class="rounded-full border px-4 py-1.5 text-sm transition-colors duration-200"
                        :class="
                            borough === b
                                ? 'border-primary bg-primary text-ink'
                                : 'border-stone/30 text-stone hover:border-primary-deep hover:bg-primary/10 hover:text-midnight'
                        "
                        @click="pickBorough(b)"
                        :aria-pressed="borough === b"
                    >
                        {{ b }}
                    </button>
                </div>
                <p v-if="boroughError" role="alert" class="text-sm text-midnight">
                    {{ boroughError }} <button class="underline" @click="loadBoroughs">Retry Boroughs</button>
                </p>
                <p v-else-if="boroughLoading" role="status" class="text-sm text-stone">Loading boroughs...</p>
            </div>

            <div
                v-if="!error && resultVersion"
                class="mb-4 mt-12 flex items-center justify-between text-sm text-stone"
            >
                <span
                    ><strong class="text-midnight">{{ data.total.toLocaleString() }}</strong> Restaurants
                    Found</span
                >
            </div>
            <div class="relative" :aria-busy="loading">
                <p role="status" class="sr-only">{{ loading ? 'Loading restaurants...' : '' }}</p>
                <div
                    class="results-transition grid transition-opacity duration-200"
                    :class="{ 'opacity-50': loading && resultVersion }"
                >
                    <Transition name="results-transition">
                        <p v-if="error" key="error" role="alert" class="mt-8 text-midnight">
                            {{ error }} <button class="underline" @click="load">Retry</button>
                        </p>
                        <RestaurantTable v-else-if="resultVersion" :key="resultVersion" :items="data.items" />
                        <p v-else key="loading" class="mt-8 min-h-80 text-stone">Loading restaurants...</p>
                    </Transition>
                </div>
            </div>

            <div v-if="!error && data.pages > 1" class="mt-8 flex items-center justify-center gap-4 text-sm">
                <button
                    :disabled="loading || page <= 1"
                    class="rounded-full border border-stone/30 px-4 py-2 transition-colors duration-200 enabled:hover:border-primary-deep enabled:hover:bg-primary/10 enabled:hover:text-midnight disabled:opacity-30"
                    @click="page--"
                >
                    ← Prev
                </button>
                <span class="text-stone">Page {{ page }} of {{ data.pages }}</span>
                <button
                    :disabled="loading || page >= data.pages"
                    class="rounded-full border border-stone/30 px-4 py-2 transition-colors duration-200 enabled:hover:border-primary-deep enabled:hover:bg-primary/10 enabled:hover:text-midnight disabled:opacity-30"
                    @click="page++"
                >
                    Next →
                </button>
            </div>
        </div>
    </section>
</template>
