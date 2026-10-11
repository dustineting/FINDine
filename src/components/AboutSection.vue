<script setup>
import AnimatedNumber from './AnimatedNumber.vue'
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
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-stone">About</p>
            <h2 class="mt-3 font-display text-4xl leading-tight text-midnight md:text-5xl">
                We've been mapping the city's appetite since day one.
            </h2>
            <p class="mt-6 leading-relaxed text-ink/75">
                FINDine brings New York's restaurant inspection records into one calm, searchable place. Every
                listing carries its borough, cuisine, street address, and the full history of grades and
                scores from city inspectors.
            </p>
            <p class="mt-4 leading-relaxed text-ink/75">
                Looking for a bakery in the Bronx or a coffee shop in Manhattan? Filter by borough, search by
                name or cuisine, or jump straight to the places with the strongest aggregated scores.
            </p>
            <p v-if="error" role="alert" class="mt-10 text-midnight">
                {{ error }} <button class="underline" @click="load">Retry Totals</button>
            </p>
            <dl
                v-else
                :aria-busy="loading"
                class="mt-10 grid grid-cols-3 gap-6 border-t border-stone/25 pt-8"
            >
                <div v-for="s in stats" :key="s.label">
                    <dt class="font-display text-4xl font-semibold text-primary-deep">
                        <AnimatedNumber v-if="s.value != null" :value="s.value" />
                        <span
                            v-else
                            class="inline-block h-8 w-16 animate-pulse rounded bg-primary/20"
                            aria-label="Loading"
                        />
                    </dt>
                    <dd class="mt-1 text-sm text-stone">{{ s.label }}</dd>
                </div>
            </dl>
        </div>
        <div class="about-portrait relative overflow-hidden rounded-t-full">
            <img
                src="/images/about-chef.avif"
                alt="Chef chopping vegetables"
                class="aspect-[4/5] w-full rounded-t-full object-cover"
            />
        </div>
    </section>
</template>
