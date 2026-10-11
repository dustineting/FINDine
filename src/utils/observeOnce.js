/** Reveal once on entry, keyboard focus, or a switch to reduced motion. */
export default function observeOnce(element, reveal) {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches || !('IntersectionObserver' in window)) {
        reveal()
        return () => {}
    }

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) show()
        },
        { rootMargin: '0px 0px -48px 0px', threshold: 0 },
    )

    function cleanup() {
        observer.disconnect()
        element.removeEventListener('focusin', show)
        motion.removeEventListener('change', onMotionChange)
    }
    function show() {
        cleanup()
        reveal()
    }
    function onMotionChange(event) {
        if (event.matches) show()
    }

    element.addEventListener('focusin', show)
    motion.addEventListener('change', onMotionChange)
    observer.observe(element)
    return cleanup
}
