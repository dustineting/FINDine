import { getAdminConfig, readSession } from '../services/adminAuth.js'
import { connectDB } from '../config/db.js'

export function requireAdmin(req, res, next) {
    res.set('Cache-Control', 'no-store')
    const config = getAdminConfig()
    if (!config) return res.status(503).json({ error: 'Admin login has not been configured.' })
    if (!readSession(req.headers.cookie, config))
        return res.status(401).json({ error: 'Please sign in to manage restaurants.' })
    res.locals.admin = true
    next()
}

export function sameOrigin(req, res, next) {
    try {
        const origin = new URL(req.get('origin'))
        if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== req.get('host'))
            throw new Error('Origin mismatch')
    } catch {
        return res.status(403).json({ error: 'This request must come from the FINDine website.' })
    }
    next()
}

export async function requireMongo(_req, res, next) {
    try {
        await connectDB()
        res.locals.source = 'mongodb'
        res.set('X-Data-Source', 'mongodb')
        next()
    } catch {
        res.status(503).json({
            error: 'MongoDB is unavailable. Restaurant management requires a database connection.',
        })
    }
}
