import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Endpoint tests deliberately use the bundled fallback, never a developer's live database.
process.env.MONGODB_URI = ''
const { createApp } = await import('../server/app.js')
const { default: vercelApp } = await import('../api/index.js')

async function listen(t, app) {
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve) => server.close(resolve)))
    return `http://127.0.0.1:${server.address().port}`
}

test('invalid restaurant queries return 400 instead of errors or oversized fallback responses', async (t) => {
    const origin = await listen(t, createApp())
    const invalid = [
        'limit=-1',
        'limit=0',
        'limit=1.5',
        'limit=abc',
        'limit=',
        'limit=2&limit=3',
        'limit=9007199254740992',
        'search=a&search=b',
        `search=${'a'.repeat(201)}`,
    ]
    for (const endpoint of ['/api/restaurants', '/api/restaurants/best']) {
        for (const query of invalid) {
            const response = await fetch(`${origin}${endpoint}?${query}`)
            assert.equal(response.status, 400, `${endpoint}?${query}`)
            assert.equal(typeof (await response.json()).error, 'string')
        }
    }
    for (const query of [
        'page=-1',
        'page=1.5',
        'page=1&page=2',
        'page=9007199254740991',
        'borough=a&borough=b',
    ]) {
        assert.equal((await fetch(`${origin}/api/restaurants?${query}`)).status, 400, query)
    }
})

test('valid fallback queries retain filtering, pagination, caps, and the required best-score rule', async (t) => {
    const origin = await listen(t, createApp())
    const get = async (url) => {
        const response = await fetch(origin + url)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('X-Data-Source'), 'json')
        return response.json()
    }
    const first = await get('/api/restaurants?borough=Brooklyn&limit=2')
    const second = await get('/api/restaurants?borough=Brooklyn&limit=2&page=2')
    assert.equal(first.items.length, 2)
    assert.ok(first.items.every((item) => item.borough === 'Brooklyn'))
    assert.equal(first.total, second.total)
    assert.notDeepEqual(first.items, second.items)
    assert.equal((await get('/api/restaurants?limit=999')).items.length, 100)
    const best = await get('/api/restaurants/best?limit=999')
    assert.equal(best.items.length, 200)
    assert.equal(best.total, best.items.length)
    assert.ok(best.items.every((item) => item.totalScore > 90))
    assert.ok(
        best.items.every((item, index) => !index || best.items[index - 1].totalScore >= item.totalScore),
    )
    assert.equal((await get('/api/restaurants?search=zzzz-no-match')).total, 0)
})

test('invalid query values cannot reach MongoDB models', async (t) => {
    const originalState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState')
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, writable: true, value: 1 })
    t.after(() => {
        if (originalState) Object.defineProperty(mongoose.connection, 'readyState', originalState)
        else delete mongoose.connection.readyState
    })
    const Restaurant = (await import('../server/models/Restaurant.js')).default
    const find = t.mock.method(Restaurant, 'find', () => {
        throw new Error('Unexpected database query')
    })
    const aggregate = t.mock.method(Restaurant, 'aggregate', () => {
        throw new Error('Unexpected aggregation')
    })
    const origin = await listen(t, createApp())
    for (const endpoint of ['/api/restaurants', '/api/restaurants/best']) {
        for (const query of ['limit=-1', 'search=a&search=b']) {
            assert.equal((await fetch(`${origin}${endpoint}?${query}`)).status, 400)
        }
    }
    assert.equal(find.mock.callCount(), 0)
    assert.equal(aggregate.mock.callCount(), 0)
})

test('standalone frontend serving keeps API and static files separate', async (t) => {
    const frontendDir = await mkdtemp(path.join(tmpdir(), 'findine-serving-'))
    t.after(() => rm(frontendDir, { recursive: true, force: true }))
    await mkdir(path.join(frontendDir, 'assets'))
    await writeFile(path.join(frontendDir, 'index.html'), '<!doctype html><title>FINDine test build</title>')
    await writeFile(path.join(frontendDir, 'assets', 'test.js'), 'console.log("FINDine")')
    const connect = t.mock.method(mongoose, 'connect', () => {
        throw new Error('Unexpected connection')
    })
    const origin = await listen(t, createApp({ serveFrontend: true, frontendDir }))
    const home = await fetch(origin)
    assert.equal(home.status, 200)
    assert.match(await home.text(), /FINDine test build/)
    assert.equal(home.headers.get('X-Data-Source'), null)
    assert.equal((await fetch(`${origin}/assets/test.js`)).status, 200)
    assert.equal((await fetch(`${origin}/assets/missing.js`)).status, 404)
    assert.equal(connect.mock.callCount(), 0)
    const health = await fetch(`${origin}/api/health`)
    assert.deepEqual(await health.json(), { ok: true, source: 'json' })
    const missing = await fetch(`${origin}/api/missing`)
    assert.equal(missing.status, 404)
    assert.deepEqual(await missing.json(), { error: 'API endpoint not found' })
})

test('Vercel entry point serves nested API routes and preserves query validation', async (t) => {
    const origin = await listen(t, vercelApp)
    const health = await fetch(`${origin}/api/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { ok: true, source: 'json' })

    const list = await fetch(`${origin}/api/restaurants?borough=Queens&limit=2&page=2`)
    assert.equal(list.status, 200)
    const data = await list.json()
    assert.equal(data.items.length, 2)
    assert.equal(data.page, 2)
    assert.ok(data.items.every((item) => item.borough === 'Queens'))

    for (const route of ['best?limit=2', 'boroughs', 'stats']) {
        const response = await fetch(`${origin}/api/restaurants/${route}`)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('X-Data-Source'), 'json')
        await response.json()
    }
    assert.equal((await fetch(`${origin}/api/restaurants?limit=-1`)).status, 400)
    assert.equal((await fetch(`${origin}/api/restaurants?search=a&search=b`)).status, 400)
    assert.equal((await fetch(`${origin}/api/unknown`)).status, 404)
    assert.equal((await fetch(origin)).status, 404)
})
