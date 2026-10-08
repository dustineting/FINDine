<script setup>
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
        <AboutSection />
        <RestaurantList />
        <BestRestaurants />
    </main>
    <SiteFooter />
</template>
