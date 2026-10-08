<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const links = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#restaurants', label: 'List of Restaurants' },
    { href: '#best', label: 'Best Quality' },
]
const scrolled = ref(false)
const open = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 40)
onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
    <header
        class="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
        :class="scrolled || open ? 'bg-forest/95 backdrop-blur shadow-lg shadow-black/10' : 'bg-transparent'"
    >
        <nav class="mx-auto flex h-18 max-w-6xl items-center justify-between px-6">
            <a href="#home" class="font-display text-2xl text-cream">
                FIND<span class="italic text-gold">ine</span>
            </a>
            <ul class="hidden gap-8 md:flex">
                <li v-for="l in links" :key="l.href">
                    <a
                        :href="l.href"
                        class="text-sm tracking-wide text-cream/80 transition hover:text-gold"
                        >{{ l.label }}</a
                    >
                </li>
            </ul>
            <button
                class="text-cream md:hidden"
                type="button"
                aria-label="Toggle menu"
                :aria-expanded="open"
                aria-controls="mobile-navigation"
                @click="open = !open"
            >
                <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path v-if="!open" d="M3 7h20M3 13h20M3 19h20" />
                    <path v-else d="M6 6l14 14M20 6L6 20" />
                </svg>
            </button>
        </nav>
        <ul v-show="open" id="mobile-navigation" class="space-y-1 px-6 pb-5 md:hidden">
            <li v-for="l in links" :key="l.href">
                <a :href="l.href" class="block py-2 text-cream/90" @click="open = false">{{ l.label }}</a>
            </li>
        </ul>
    </header>
</template>
