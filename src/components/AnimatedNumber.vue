<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import observeOnce from '../utils/observeOnce.js'

const props = defineProps({ value: { type: Number, required: true } })
const element = ref(null)
const visible = ref(false)
const displayed = ref(0)
const format = new Intl.NumberFormat('en-US')
let frame = null
let stopObserving = () => {}
let motion

function cancel() {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
}

function animate() {
    cancel()
    if (!visible.value) return
    if (motion.matches) {
        displayed.value = props.value
        return
    }

    const from = displayed.value
    const target = props.value
    const started = performance.now()
    function tick(now) {
        const progress = Math.min((now - started) / 1200, 1)
        const eased = 1 - (1 - progress) ** 3
        displayed.value = Math.round(from + (target - from) * eased)
        frame = progress < 1 ? requestAnimationFrame(tick) : null
    }
    frame = requestAnimationFrame(tick)
}

function onMotionChange(event) {
    if (event.matches) {
        cancel()
        displayed.value = props.value
    }
}

watch(() => props.value, animate)
onMounted(() => {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', onMotionChange)
    stopObserving = observeOnce(element.value, () => {
        visible.value = true
        animate()
    })
})
onBeforeUnmount(() => {
    cancel()
    stopObserving()
    motion?.removeEventListener('change', onMotionChange)
})
</script>

<template>
    <span ref="element" class="stat-number inline-block tabular-nums" :class="{ 'is-visible': visible }">
        <span aria-hidden="true">{{ format.format(displayed) }}</span>
        <span class="sr-only">{{ format.format(value) }}</span>
    </span>
</template>
