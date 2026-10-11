import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import dns from 'node:dns'
import { connectDB, markDBFailed } from '../server/config/db.js'

test('database connections are shared, recover after failure, and respect cooldowns', async (t) => {
    const originalUri = process.env.MONGODB_URI
    const originalDnsServers = process.env.MONGODB_DNS_SERVERS
    delete process.env.MONGODB_DNS_SERVERS
    t.after(() => {
        if (originalUri === undefined) delete process.env.MONGODB_URI
        else process.env.MONGODB_URI = originalUri
        if (originalDnsServers === undefined) delete process.env.MONGODB_DNS_SERVERS
        else process.env.MONGODB_DNS_SERVERS = originalDnsServers
    })

    let now = 100_000
    const originalState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState')
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, writable: true, value: 0 })
    t.after(() => {
        if (originalState) Object.defineProperty(mongoose.connection, 'readyState', originalState)
        else delete mongoose.connection.readyState
    })
    const attempts = []
    t.mock.method(Date, 'now', () => now)
    t.mock.method(console, 'log', () => {})
    t.mock.method(console, 'warn', () => {})
    const setServers = t.mock.method(dns, 'setServers', () => {})
    const connect = t.mock.method(mongoose, 'connect', (uri, options) => {
        assert.equal(uri, 'mongodb://localhost/findine')
        assert.equal(options.serverSelectionTimeoutMS, 5000)
        return new Promise((resolve, reject) => attempts.push({ resolve, reject }))
    })

    delete process.env.MONGODB_URI
    await assert.rejects(connectDB(), /not configured/)
    assert.equal(connect.mock.callCount(), 0)

    process.env.MONGODB_URI = 'mongodb://localhost/findine'
    const first = connectDB()
    const simultaneous = connectDB()
    assert.equal(connect.mock.callCount(), 1)
    assert.equal(setServers.mock.callCount(), 0)
    mongoose.connection.readyState = 1
    attempts[0].resolve(mongoose)
    assert.equal(await first, mongoose.connection)
    assert.equal(await simultaneous, mongoose.connection)
    assert.equal(await connectDB(), mongoose.connection)
    assert.equal(connect.mock.callCount(), 1)

    // A failed query must trigger fallback even if Mongoose still reports connected.
    markDBFailed()
    await assert.rejects(connectDB(), /temporarily unavailable/)
    now += 60_000
    assert.equal(await connectDB(), mongoose.connection)

    // A dropped connection must not reuse the previous, already-resolved promise.
    mongoose.connection.readyState = 0
    process.env.MONGODB_DNS_SERVERS = ' 1.1.1.1, ,8.8.8.8 '
    const dropped = connectDB()
    assert.deepEqual(setServers.mock.calls[0].arguments, [['1.1.1.1', '8.8.8.8']])
    assert.equal(connect.mock.callCount(), 2)
    attempts[1].reject(new Error('Connection refused'))
    await assert.rejects(dropped, /Connection refused/)
    await assert.rejects(connectDB(), /temporarily unavailable/)
    assert.equal(connect.mock.callCount(), 2)

    now += 60_000
    const retry = connectDB()
    assert.equal(connect.mock.callCount(), 3)
    mongoose.connection.readyState = 1
    attempts[2].resolve(mongoose)
    assert.equal(await retry, mongoose.connection)
})
