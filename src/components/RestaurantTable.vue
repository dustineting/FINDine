<script setup>
defineProps({
    items: { type: Array, required: true },
    showTotal: Boolean,
    dark: Boolean,
})
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
const gradeColor = { A: 'bg-forest text-cream', B: 'bg-gold text-charcoal', C: 'bg-[#a8553a] text-cream' }
</script>

<template>
    <div
        class="overflow-x-auto rounded-2xl"
        :class="dark ? 'bg-white/5 ring-1 ring-cream/10' : 'bg-white ring-1 ring-olive/15'"
    >
        <table class="w-full min-w-[820px] text-left text-sm">
            <thead>
                <tr
                    class="text-xs uppercase tracking-wider"
                    :class="dark ? 'text-gold' : 'bg-forest text-cream'"
                >
                    <th class="px-5 py-4 font-bold">Name</th>
                    <th class="px-5 py-4 font-bold">Borough</th>
                    <th class="px-5 py-4 font-bold">Cuisine</th>
                    <th class="px-5 py-4 font-bold">Address</th>
                    <th class="px-5 py-4 font-bold">Grades</th>
                    <th v-if="showTotal" class="px-5 py-4 text-right font-bold">Total score</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="r in items"
                    :key="r.restaurant_id + r.name"
                    class="border-t align-top"
                    :class="dark ? 'border-cream/10 hover:bg-white/5' : 'border-olive/10 hover:bg-cream/60'"
                >
                    <td class="px-5 py-4 font-display text-base" :class="dark ? 'text-cream' : 'text-forest'">
                        {{ r.name }}
                    </td>
                    <td class="px-5 py-4">{{ r.borough }}</td>
                    <td class="px-5 py-4">{{ r.cuisine }}</td>
                    <td class="px-5 py-4" :class="dark ? 'text-cream/70' : 'text-charcoal/70'">
                        {{ r.address?.building }} {{ r.address?.street }}<br />
                        <span class="text-xs">NY {{ r.address?.zipcode }}</span>
                    </td>
                    <td class="px-5 py-4">
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                v-for="(g, i) in r.grades"
                                :key="i"
                                :title="`${fmt(g.date)} · score ${g.score}`"
                                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                                :class="gradeColor[g.grade] || 'bg-olive/20 text-charcoal'"
                            >
                                {{ g.grade }}<span class="font-normal opacity-75">{{ g.score }}</span>
                            </span>
                        </div>
                    </td>
                    <td v-if="showTotal" class="px-5 py-4 text-right font-display text-2xl text-gold">
                        {{ r.totalScore }}
                    </td>
                </tr>
                <tr v-if="!items.length">
                    <td :colspan="showTotal ? 6 : 5" class="px-5 py-14 text-center text-olive">
                        No restaurants match your search.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
