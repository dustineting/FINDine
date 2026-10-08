<template>
    <section id="home" class="relative flex min-h-[92vh] items-end overflow-hidden bg-charcoal">
        <img
            src="https://images.unsplash.com/photo-1536392706976-e486e2ba97af?auto=format&fit=crop&w=2000&q=80"
            alt="Candlelit dinner table set with flowers"
            class="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-transparent" />
        <div class="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-40">
            <p class="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-gold">
                New York City · Restaurant Finder
            </p>
            <h1 class="max-w-3xl font-display text-5xl leading-[1.05] text-cream md:text-7xl">
                Find the table <em class="text-gold">worth</em> the trip.
            </h1>
            <p class="mt-6 max-w-xl text-lg text-cream/80">
                Search thousands of restaurants across the five boroughs by name or cuisine, and see how each
                one fares in health inspections.
            </p>
            <div class="mt-10 flex flex-wrap gap-4">
                <a
                    href="#restaurants"
                    class="rounded-full bg-gold px-7 py-3 font-bold text-charcoal transition hover:bg-cream"
                >
                    Browse restaurants
                </a>
                <a
                    href="#best"
                    class="rounded-full border border-cream/40 px-7 py-3 text-cream transition hover:border-gold hover:text-gold"
                >
                    Best quality
                </a>
            </div>
        </div>
    </section>
</template>
