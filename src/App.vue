<script setup>
import vReveal from './directives/reveal.js'
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
import RestaurantList from './components/RestaurantList.vue'
import BestRestaurants from './components/BestRestaurants.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
    <NavBar />
    <main>
        <HeroSection />
        <AboutSection v-reveal />
        <RestaurantList v-reveal />
        <BestRestaurants v-reveal />
    </main>
    <SiteFooter v-reveal />
</template>
