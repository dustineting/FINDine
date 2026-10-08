import mongoose from 'mongoose'

// Let Express use its JSON fallback instead of queuing queries while disconnected.
mongoose.set('bufferCommands', false)

const CONNECT_TIMEOUT_MS = 5_000
const RETRY_DELAY_MS = 60_000

let connectionPromise = null
let retryAfter = 0

export function markDBFailed() {
    retryAfter = Date.now() + RETRY_DELAY_MS
}

/** Reuse an open connection or share one connection attempt across requests. */
export async function connectDB() {
    // Check the cooldown first, including when a query failed on an open connection.
    if (Date.now() < retryAfter) {
        throw new Error('MongoDB is temporarily unavailable')
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    const uri = process.env.MONGODB_URI?.trim()

    if (!uri) {
        throw new Error('MONGODB_URI is not configured')
    }

    if (!connectionPromise) {
        connectionPromise = openConnection(uri)
    }

    return connectionPromise
}

async function openConnection(uri) {
    try {
        // Mongoose owns the timeout; no competing timer or background disconnect is needed.
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
            connectTimeoutMS: CONNECT_TIMEOUT_MS,
        })

        retryAfter = 0
        console.log('[db] Connected to MongoDB')

        return mongoose.connection
    } catch (error) {
        markDBFailed()
        console.warn('[db] MongoDB connection failed; Express will try the JSON fallback')

        throw error
    } finally {
        connectionPromise = null
    }
}
