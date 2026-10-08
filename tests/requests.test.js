import assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope } from 'vue'
import { fetchRestaurants, fetchBestRestaurants, fetchBoroughs, fetchStats } from '../src/services/api.js'
import useRequest from '../src/composables/useRequest.js'

test('API client sends filters and limits to Express and returns its data', async (t) => {
    const calls = []
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push(url)
        assert.ok(options.signal instanceof AbortSignal)
        return Response.json({ items: [{ name: 'From Express' }] })
    })
    assert.deepEqual(await fetchRestaurants({ search: 'A & B', borough: 'Queens', page: 2, limit: 15 }), {
        items: [{ name: 'From Express' }],
    })
    await fetchBestRestaurants({ limit: 1 })
    await fetchBoroughs()
    await fetchStats()
    assert.deepEqual(calls, [
        '/api/restaurants?search=A+%26+B&borough=Queens&page=2&limit=15',
        '/api/restaurants/best?limit=1',
        '/api/restaurants/boroughs',
        '/api/restaurants/stats',
    ])
})

test('API failures reject instead of substituting sample restaurants', async (t) => {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }))
    await assert.rejects(fetchRestaurants(), /Unable to load restaurant data/)
    fetchMock.mock.mockImplementation(async () => {
        throw new TypeError('Network failure')
    })
    await assert.rejects(fetchStats(), /Unable to reach the server/)
    fetchMock.mock.mockImplementation(async () => {
        throw new DOMException('Timed out', 'TimeoutError')
    })
    await assert.rejects(fetchBoroughs(), /request took too long/)
    fetchMock.mock.mockImplementation(async () => new Response('<html>Not JSON</html>'))
    await assert.rejects(fetchBestRestaurants(), /unexpected response/)
})

test('request state resets after failure and supports retry', async () => {
    const scope = effectScope()
    let fail = true
    const state = scope.run(() =>
        useRequest(async () => {
            if (fail) throw new Error('Unavailable')
            return ['Restaurant']
        }, []),
    )
    try {
        const first = state.load()
        assert.equal(state.loading.value, true)
        await first
        assert.equal(state.loading.value, false)
        assert.equal(state.error.value, 'Unavailable')
        assert.deepEqual(state.data.value, [])
        fail = false
        await state.load()
        assert.equal(state.error.value, '')
        assert.deepEqual(state.data.value, ['Restaurant'])
        fail = true
        await state.load()
        assert.deepEqual(state.data.value, [])
    } finally {
        scope.stop()
    }
})

test('older responses and responses after disposal cannot replace current results', async () => {
    const pending = []
    const scope = effectScope()
    const state = scope.run(() =>
        useRequest(() => new Promise((resolve, reject) => pending.push({ resolve, reject })), []),
    )
    try {
        const old = state.load()
        const current = state.load()
        pending[1].resolve(['Current'])
        await current
        pending[0].reject(new Error('Old failure'))
        await old
        assert.deepEqual(state.data.value, ['Current'])
        assert.equal(state.error.value, '')
        assert.equal(state.loading.value, false)

        const older = state.load()
        const newer = state.load()
        pending[2].resolve(['Stale'])
        await older
        assert.deepEqual(state.data.value, ['Current'])
        assert.equal(state.loading.value, true)
        pending[3].resolve(['Newest'])
        await newer
        assert.deepEqual(state.data.value, ['Newest'])

        const last = state.load()
        scope.stop()
        pending[4].resolve(['After disposal'])
        await last
        assert.deepEqual(state.data.value, ['Newest'])
    } finally {
        scope.stop()
    }
})
