<script setup>
import { reactive, ref, useId, onMounted } from 'vue'

const props = defineProps({
    item: { type: Object, default: null },
    busy: Boolean,
    error: { type: String, default: '' },
})
const emit = defineEmits(['save', 'cancel'])
const id = useId()
const firstInput = ref(null)
const dateValue = (value) =>
    value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().slice(0, 10) : ''
const initial = {
    name: props.item?.name || '',
    restaurant_id: props.item?.restaurant_id || '',
    borough: props.item?.borough || '',
    cuisine: props.item?.cuisine || '',
    address: Object.fromEntries(
        ['building', 'street', 'zipcode'].map((key) => [key, props.item?.address?.[key] || '']),
    ),
    grades: (props.item?.grades || []).map((grade) => ({
        date: dateValue(grade.date),
        grade: grade.grade || '',
        score: grade.score ?? '',
    })),
}
const form = reactive(structuredClone(initial))
const fields = [
    { key: 'name', label: 'Restaurant Name', required: true },
    { key: 'restaurant_id', label: 'Restaurant Identifier (Optional)' },
    { key: 'borough', label: 'Borough', required: true },
    { key: 'cuisine', label: 'Cuisine', required: true },
]
const inputClass =
    'w-full rounded-xl border border-stone/30 bg-paper px-3 py-2 text-ink focus:border-primary-deep'

function submit() {
    const payload = {}
    for (const { key } of fields) {
        if (!props.item || form[key] !== initial[key]) {
            if (key === 'restaurant_id' && !form[key] && !props.item) continue
            payload[key] = form[key]
        }
    }
    const address = Object.fromEntries(
        Object.entries(form.address).filter(([key, value]) => !props.item || value !== initial.address[key]),
    )
    if (Object.keys(address).length) payload.address = address
    if (!props.item || JSON.stringify(form.grades) !== JSON.stringify(initial.grades)) {
        payload.grades = form.grades.map((grade) => ({ ...grade, score: Number(grade.score) }))
    }
    emit('save', payload)
}

onMounted(() => firstInput.value?.[0]?.focus())
</script>

<template>
    <section
        class="mt-8 rounded-2xl border border-stone/20 bg-paper p-6 md:p-8"
        :aria-labelledby="`${id}-title`"
    >
        <h2 :id="`${id}-title`" class="text-3xl text-midnight">
            {{ item ? 'Edit Restaurant' : 'Add Restaurant' }}
        </h2>
        <form class="mt-6 space-y-6" :aria-busy="busy" @submit.prevent="submit">
            <fieldset :disabled="busy" class="grid gap-5 md:grid-cols-2">
                <div v-for="field in fields" :key="field.key">
                    <label
                        :for="`${id}-${field.key}`"
                        class="mb-2 block text-sm font-semibold text-midnight"
                        >{{ field.label }}</label
                    >
                    <input
                        ref="firstInput"
                        :id="`${id}-${field.key}`"
                        v-model="form[field.key]"
                        :class="inputClass"
                        :required="field.required"
                        :maxlength="field.key === 'borough' ? 100 : 200"
                    />
                </div>
            </fieldset>
            <fieldset :disabled="busy" class="grid gap-5 md:grid-cols-3">
                <legend class="mb-3 font-semibold text-midnight">Address</legend>
                <div v-for="key in ['building', 'street', 'zipcode']" :key="key">
                    <label :for="`${id}-${key}`" class="mb-2 block text-sm capitalize">{{
                        key === 'zipcode' ? 'ZIP code' : key
                    }}</label>
                    <input
                        :id="`${id}-${key}`"
                        v-model="form.address[key]"
                        :class="inputClass"
                        maxlength="200"
                    />
                </div>
            </fieldset>
            <fieldset :disabled="busy" class="space-y-4">
                <legend class="mb-2 font-semibold text-midnight">Inspection Records</legend>
                <p class="text-sm text-stone">
                    Optional when adding a restaurant. Existing records remain unchanged unless edited here.
                </p>
                <div
                    v-for="(grade, index) in form.grades"
                    :key="index"
                    class="grid items-end gap-3 rounded-xl bg-cream p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
                >
                    <div>
                        <label :for="`${id}-date-${index}`" class="mb-2 block text-sm">Inspection Date</label>
                        <input
                            :id="`${id}-date-${index}`"
                            v-model="grade.date"
                            type="date"
                            required
                            :class="inputClass"
                        />
                    </div>
                    <div>
                        <label :for="`${id}-grade-${index}`" class="mb-2 block text-sm">Grade</label>
                        <input
                            :id="`${id}-grade-${index}`"
                            v-model="grade.grade"
                            required
                            maxlength="30"
                            :class="inputClass"
                        />
                    </div>
                    <div>
                        <label :for="`${id}-score-${index}`" class="mb-2 block text-sm">Score</label>
                        <input
                            :id="`${id}-score-${index}`"
                            v-model.number="grade.score"
                            type="number"
                            required
                            min="0"
                            max="1000"
                            step="1"
                            :class="inputClass"
                        />
                    </div>
                    <button
                        type="button"
                        class="rounded-xl border border-stone/30 px-3 py-2 text-sm hover:bg-primary/15"
                        :aria-label="`Remove Inspection ${index + 1}`"
                        @click="form.grades.splice(index, 1)"
                    >
                        Remove
                    </button>
                </div>
                <button
                    type="button"
                    :disabled="form.grades.length >= 100"
                    class="rounded-full border border-primary-deep px-4 py-2 text-sm text-primary-deep hover:bg-primary/10 disabled:opacity-40"
                    @click="form.grades.push({ date: '', grade: '', score: '' })"
                >
                    Add Inspection
                </button>
            </fieldset>
            <p v-if="error" role="alert" class="text-sm text-midnight">{{ error }}</p>
            <div class="flex flex-wrap gap-3">
                <button
                    :disabled="busy"
                    class="rounded-full bg-midnight px-6 py-3 font-semibold text-cream hover:bg-primary-deep disabled:opacity-50"
                >
                    {{ busy ? 'Saving...' : 'Save Restaurant' }}
                </button>
                <button
                    type="button"
                    :disabled="busy"
                    class="rounded-full border border-stone/30 px-6 py-3 hover:bg-primary/10 disabled:opacity-50"
                    @click="emit('cancel')"
                >
                    Cancel
                </button>
            </div>
        </form>
    </section>
</template>
