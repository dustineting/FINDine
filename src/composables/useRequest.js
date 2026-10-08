import { ref, onScopeDispose } from 'vue'

/** Share request state and prevent older responses from replacing newer results. */
export default function useRequest(request, initialValue) {
    const data = ref(initialValue)
    const loading = ref(false)
    const error = ref('')
    let latestRequest = 0

    async function load() {
        const id = ++latestRequest
        loading.value = true
        error.value = ''
        try {
            const result = await request()
            if (id === latestRequest) data.value = result
        } catch (cause) {
            if (id === latestRequest) {
                data.value = initialValue
                error.value =
                    cause instanceof Error ? cause.message : 'Unable to load data. Please try again.'
            }
        } finally {
            if (id === latestRequest) loading.value = false
        }
    }

    onScopeDispose(() => {
        latestRequest++
    })
    return { data, loading, error, load }
}
