import assert from 'node:assert/strict'
import test, { before } from 'node:test'
import mongoose from 'mongoose'
import {
    COOKIE_NAME,
    createSession,
    getAdminConfig,
    hashPassword,
    readSession,
    verifyPassword,
} from '../server/services/adminAuth.js'

process.env.MONGODB_URI = ''
const { createApp } = await import('../server/app.js')
const { default: Restaurant } = await import('../server/models/Restaurant.js')
const password = 'test-only-password-12345'

before(async () => {
    process.env.ADMIN_USERNAME = 'test_admin'
    process.env.ADMIN_PASSWORD_HASH = await hashPassword(password)
    process.env.ADMIN_SESSION_SECRET = 'test-only-session-secret-at-least-32-characters'
})

async function listen(t) {
    const server = createApp().listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve) => server.close(resolve)))
    const origin = `http://127.0.0.1:${server.address().port}`
    return {
        origin,
        request: (url, { method = 'GET', body, cookie, originHeader = origin, ...options } = {}) =>
            fetch(origin + url, {
                method,
                headers: {
                    Origin: originHeader,
                    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
                    ...(cookie ? { Cookie: cookie } : {}),
                    ...options.headers,
                },
                body: body === undefined ? undefined : JSON.stringify(body),
            }),
    }
}

const sessionCookie = () => `${COOKIE_NAME}=${createSession(getAdminConfig())}`

test('password hashes and signed sessions reject wrong passwords, tampering, expiry, and credential rotation', async (t) => {
    const config = getAdminConfig()
    assert.notEqual(config.passwordHash, password)
    assert.equal(await verifyPassword(password, config.passwordHash), true)
    assert.equal(await verifyPassword('wrong-password', config.passwordHash), false)
    const cookie = sessionCookie()
    assert.equal(readSession(cookie, config), 'test_admin')
    assert.equal(readSession(`${cookie}x`, config), null)
    assert.equal(readSession(cookie, { ...config, secret: 'another-32-character-secret-value' }), null)
    assert.equal(
        readSession(cookie, {
            ...config,
            passwordHash: config.passwordHash.replace(/.$/, config.passwordHash.endsWith('a') ? 'b' : 'a'),
        }),
        null,
    )
    const now = Date.now()
    t.mock.method(Date, 'now', () => now + 3601 * 1000)
    assert.equal(readSession(cookie, config), null)
    assert.equal(readSession('findine_admin=malformed', config), null)
})

test('login uses a private cookie, checks origin and credentials, and logout clears it', async (t) => {
    const { request } = await listen(t)
    assert.deepEqual(await (await request('/api/admin/session')).json(), {
        configured: true,
        authenticated: false,
    })
    assert.equal(
        (
            await request('/api/admin/login', {
                method: 'POST',
                originHeader: 'https://other.example',
                body: { username: 'test_admin', password },
            })
        ).status,
        403,
    )
    assert.equal(
        (
            await request('/api/admin/login', {
                method: 'POST',
                body: { username: 'test_admin', password: 'wrong-password' },
            })
        ).status,
        401,
    )
    const response = await request('/api/admin/login', {
        method: 'POST',
        body: { username: 'test_admin', password },
        headers: { 'X-Forwarded-Proto': 'https' },
    })
    assert.equal(response.status, 200)
    const header = response.headers.get('set-cookie')
    assert.match(header, /HttpOnly/)
    assert.match(header, /SameSite=Strict/)
    assert.match(header, /Secure/)
    assert.match(header, /Path=\/api/)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const cookie = header.split(';')[0]
    assert.equal((await (await request('/api/admin/session', { cookie })).json()).authenticated, true)
    const logout = await request('/api/admin/logout', { method: 'POST', cookie })
    assert.equal(logout.status, 200)
    assert.match(logout.headers.get('set-cookie'), /findine_admin=;/)
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/)
})

test('all management endpoints require authentication and same-origin writes', async (t) => {
    const { request } = await listen(t)
    const id = '000000000000000000000001'
    for (const [method, endpoint] of [
        ['GET', '/api/admin/restaurants'],
        ['POST', '/api/restaurants'],
        ['PATCH', `/api/restaurants/${id}`],
        ['DELETE', `/api/restaurants/${id}`],
    ]) {
        assert.equal((await request(endpoint, { method })).status, 401)
        assert.equal((await request(endpoint, { method, cookie: 'findine_admin=bad' })).status, 401)
    }
    for (const method of ['POST', 'PATCH', 'DELETE']) {
        const endpoint = method === 'POST' ? '/api/restaurants' : `/api/restaurants/${id}`
        assert.equal(
            (
                await request(endpoint, {
                    method,
                    cookie: sessionCookie(),
                    originHeader: 'https://other.example',
                })
            ).status,
            403,
        )
    }
    const original = process.env.ADMIN_SESSION_SECRET
    const cookie = sessionCookie()
    delete process.env.ADMIN_SESSION_SECRET
    t.after(() => {
        process.env.ADMIN_SESSION_SECRET = original
    })
    assert.equal((await request('/api/admin/restaurants', { cookie })).status, 503)
})

test('management never writes or reports success through the JSON fallback', async (t) => {
    const { request } = await listen(t)
    const create = t.mock.method(Restaurant, 'create', () => {
        throw new Error('Unexpected write')
    })
    const cookie = sessionCookie()
    for (const [method, endpoint, body] of [
        ['GET', '/api/admin/restaurants'],
        ['POST', '/api/restaurants', { name: 'Test', borough: 'Queens', cuisine: 'Bakery' }],
        ['PATCH', '/api/restaurants/000000000000000000000001', { name: 'Changed' }],
        ['DELETE', '/api/restaurants/000000000000000000000001'],
    ])
        assert.equal((await request(endpoint, { method, body, cookie })).status, 503)
    assert.equal(create.mock.callCount(), 0)
})

test('invalid fields, IDs, dates, scores and operators are rejected before writes', async (t) => {
    const { request } = await listen(t)
    const cookie = sessionCookie()
    const body = { name: 'Test', cuisine: 'Bakery', borough: 'Queens' }
    for (const value of [
        null,
        [],
        {},
        { ...body, name: ' ' },
        { ...body, $set: { name: 'bad' } },
        { ...body, _id: 'override' },
        { ...body, address: { coord: [1, 2] } },
        { ...body, address: {} },
        { ...body, grades: [{ date: '2026-02-30', grade: 'A', score: 1 }] },
        { ...body, grades: [{ date: '2026-01-01', grade: 'A', score: -1 }] },
    ]) {
        assert.equal((await request('/api/restaurants', { method: 'POST', body: value, cookie })).status, 400)
    }
    for (const method of ['PATCH', 'DELETE'])
        assert.equal(
            (
                await request('/api/restaurants/not-an-id', {
                    method,
                    body: method === 'PATCH' ? { name: 'Test' } : undefined,
                    cookie,
                })
            ).status,
            400,
        )
})

test('authenticated CRUD saves, edits without losing coordinates or grades, deletes, and handles missing records', async (t) => {
    const state = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState')
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, writable: true, value: 1 })
    t.after(() => {
        if (state) Object.defineProperty(mongoose.connection, 'readyState', state)
        else delete mongoose.connection.readyState
    })
    const records = new Map()
    const query = (value) => ({
        maxTimeMS() {
            return this
        },
        lean: async () => value,
    })
    t.mock.method(Restaurant, 'create', async (body) => {
        const item = { ...body, _id: new mongoose.Types.ObjectId().toHexString(), grades: body.grades || [] }
        records.set(item._id, item)
        return item
    })
    t.mock.method(Restaurant, 'findByIdAndUpdate', (id, update, options) => {
        assert.deepEqual(options, { new: true, runValidators: true })
        const item = records.get(id)
        if (item)
            for (const [key, value] of Object.entries(update.$set)) {
                if (key.startsWith('address.')) item.address[key.slice(8)] = value
                else item[key] = value
            }
        return query(item || null)
    })
    t.mock.method(Restaurant, 'findByIdAndDelete', (id) => {
        const item = records.get(id)
        records.delete(id)
        return query(item || null)
    })
    t.mock.method(Restaurant, 'find', (_filter, projection) => {
        assert.equal(projection._id, 1)
        return {
            ...query([...records.values()]),
            sort() {
                return this
            },
            skip() {
                return this
            },
            limit() {
                return this
            },
        }
    })
    t.mock.method(Restaurant, 'countDocuments', () => ({ maxTimeMS: async () => records.size }))
    const { request } = await listen(t)
    const cookie = sessionCookie()
    const created = await request('/api/restaurants', {
        method: 'POST',
        cookie,
        body: {
            name: 'CRUD Test',
            borough: 'Queens',
            cuisine: 'Bakery',
            address: { street: 'First Street' },
            grades: [{ date: '2026-01-01', grade: 'A', score: 5 }],
        },
    })
    assert.equal(created.status, 201)
    const item = (await created.json()).item
    assert.ok(item.restaurant_id)
    records.get(item._id).address.coord = [-73, 40]
    const list = await request('/api/admin/restaurants', { cookie })
    assert.equal(list.status, 200)
    assert.equal((await list.json()).items[0]._id, item._id)
    const updated = await request(`/api/restaurants/${item._id}`, {
        method: 'PATCH',
        cookie,
        body: { name: 'Edited Test', address: { street: 'Second Street' } },
    })
    assert.equal(updated.status, 200)
    const changed = (await updated.json()).item
    assert.equal(changed.name, 'Edited Test')
    assert.deepEqual(changed.address.coord, [-73, 40])
    assert.equal(changed.grades[0].score, 5)
    assert.equal(changed.restaurant_id, item.restaurant_id)
    assert.equal((await request(`/api/restaurants/${item._id}`, { method: 'DELETE', cookie })).status, 204)
    assert.equal(records.size, 0)
    assert.equal((await request(`/api/restaurants/${item._id}`, { method: 'DELETE', cookie })).status, 404)
    assert.equal(
        (await request(`/api/restaurants/${item._id}`, { method: 'PATCH', cookie, body: { name: 'Gone' } }))
            .status,
        404,
    )
})

test('repeated failed login attempts are throttled', async (t) => {
    const { request } = await listen(t)
    let response
    for (let index = 0; index < 6; index++)
        response = await request('/api/admin/login', {
            method: 'POST',
            body: { username: 'test_admin', password: 'wrong-password' },
        })
    assert.equal(response.status, 429)
    assert.ok(Number(response.headers.get('retry-after')) > 0)
})
