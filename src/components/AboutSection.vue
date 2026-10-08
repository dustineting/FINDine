<script setup>
import { computed, onMounted } from 'vue'
import useRequest from '../composables/useRequest.js'
import { fetchStats } from '../services/api.js'

const { data: counts, loading, error, load } = useRequest(fetchStats, null)
onMounted(load)

const stats = computed(() => [
    { value: counts.value?.restaurants, label: 'Restaurants indexed' },
    { value: counts.value?.boroughs, label: 'Boroughs covered' },
    { value: counts.value?.cuisines, label: 'Cuisines' },
])
</script>

<template>
    <section id="about" class="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 md:grid-cols-2">
        <div>
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-olive">About</p>
            <h2 class="mt-3 font-display text-4xl leading-tight text-forest md:text-5xl">
                We've been mapping the city's appetite since day one.
            </h2>
            <p class="mt-6 leading-relaxed text-charcoal/75">
                FINDine brings New York's restaurant inspection records into one calm, searchable place. Every
                listing carries its borough, cuisine, street address, and the full history of grades and
                scores from city inspectors.
            </p>
            <p class="mt-4 leading-relaxed text-charcoal/75">
                Looking for a bakery in the Bronx or a coffee shop in Manhattan? Filter by borough, search by
                name or cuisine, or jump straight to the places with the strongest aggregated scores.
            </p>
            <p v-if="error" role="alert" class="mt-10 text-forest">
                {{ error }} <button class="underline" @click="load">Retry totals</button>
            </p>
            <dl
                v-else
                :aria-busy="loading"
                class="mt-10 grid grid-cols-3 gap-6 border-t border-olive/25 pt-8"
            >
                <div v-for="s in stats" :key="s.label">
                    <dt class="font-display text-3xl text-gold">
                        <span v-if="s.value != null">{{ s.value.toLocaleString() }}</span>
                        <span
                            v-else
                            class="inline-block h-8 w-16 animate-pulse rounded bg-gold/20"
                            aria-label="Loading"
                        />
                    </dt>
                    <dd class="mt-1 text-sm text-olive">{{ s.label }}</dd>
                </div>
            </dl>
        </div>
        <div class="relative">
            <img
                src="https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?auto=format&fit=crop&w=1200&q=80"
                alt="Chef chopping vegetables"
                class="aspect-[4/5] w-full rounded-t-full object-cover"
            />
            <div class="absolute -bottom-6 -left-6 rounded-2xl bg-forest px-6 py-5 text-cream shadow-xl">
                <p class="font-display text-xl italic">"Good food, honestly graded."</p>
            </div>
        </div>
    </section>
</template>
