<template>
    <footer class="bg-midnight py-10 text-cream/60">
        <div
            class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row"
        >
            <a href="#home" class="font-display text-2xl font-semibold tracking-tight text-cream"
                >FIND<span class="italic text-primary">ine</span></a
            >
            <p>Built with MongoDB · Express · Vue · Node</p>
            <a href="#admin" class="nav-link hover:text-primary">Admin</a>
            <p>© {{ new Date().getFullYear() }} FINDine</p>
        </div>
    </footer>
</template>
