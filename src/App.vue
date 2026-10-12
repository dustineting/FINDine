<script setup>
import vReveal from './directives/reveal.js'
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
import RestaurantList from './components/RestaurantList.vue'
import BestRestaurants from './components/BestRestaurants.vue'
import SiteFooter from './components/SiteFooter.vue'
import AdminPage from './components/AdminPage.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const admin = ref(window.location.hash === '#admin')
const onHashChange = () => {
    admin.value = window.location.hash === '#admin'
}
onMounted(() => window.addEventListener('hashchange', onHashChange))
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))
</script>

<template>
    <AdminPage v-if="admin" />
    <template v-else>
        <NavBar />
        <main>
            <HeroSection />
            <AboutSection v-reveal />
            <RestaurantList v-reveal />
            <BestRestaurants v-reveal />
        </main>
        <SiteFooter v-reveal />
    </template>
</template>
