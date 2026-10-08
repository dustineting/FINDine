<template>
    <footer class="bg-charcoal py-10 text-cream/60">
        <div
            class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row"
        >
            <a href="#home" class="font-display text-xl text-cream"
                >FIND<span class="italic text-gold">ine</span></a
            >
            <p>Built with MongoDB · Express · Vue · Node</p>
            <p>© {{ new Date().getFullYear() }} FINDine</p>
        </div>
    </footer>
</template>
