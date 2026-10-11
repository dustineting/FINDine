import observeOnce from '../utils/observeOnce.js'

const cleanups = new WeakMap()

export default {
    beforeMount(element) {
        element.classList.add('reveal-section')
    },
    mounted(element) {
        cleanups.set(
            element,
            observeOnce(element, () => element.classList.add('is-revealed')),
        )
    },
    beforeUnmount(element) {
        cleanups.get(element)?.()
        cleanups.delete(element)
    },
}
