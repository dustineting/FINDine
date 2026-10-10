<template>
    <section id="home" class="relative flex min-h-[92vh] items-end overflow-hidden bg-midnight">
        <img
            src="https://images.unsplash.com/photo-1536392706976-e486e2ba97af?auto=format&fit=crop&w=2000&q=80"
            alt="Candlelit dinner table set with flowers"
            class="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />
        <div class="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-40">
            <p class="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-primary">
                New York City · Restaurant Finder
            </p>
            <h1 class="max-w-3xl font-display text-5xl leading-[1.05] text-cream md:text-7xl">
                Find the table <em class="text-primary">worth</em> the trip.
            </h1>
            <p class="mt-6 max-w-xl text-lg text-cream/80">
                Search thousands of restaurants across the five boroughs by name or cuisine, and see how each
                one fares in health inspections.
            </p>
            <div class="mt-10 flex flex-wrap gap-4">
                <a
                    href="#restaurants"
                    class="rounded-full bg-primary px-7 py-3 font-semibold text-midnight transition-colors duration-200 hover:bg-primary-light"
                >
                    Browse Restaurants
                </a>
                <a
                    href="#best"
                    class="rounded-full border border-cream/40 px-7 py-3 text-cream transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                    Best Quality
                </a>
            </div>
        </div>
    </section>
</template>
