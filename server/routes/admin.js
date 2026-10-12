import { Router } from 'express'
import {
    COOKIE_NAME,
    SESSION_SECONDS,
    cookieOptions,
    createSession,
    getAdminConfig,
    readSession,
    verifyPassword,
} from '../services/adminAuth.js'
import { requireAdmin, requireMongo, sameOrigin } from '../middleware/admin.js'
import restaurantQuery from '../middleware/restaurantQuery.js'
import { listRestaurants } from '../controllers/restaurantController.js'

const router = Router()
const attempts = new Map()
let globalAttempts = { count: 0, expires: 0 }

router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
})

router.get('/session', (req, res) => {
    const config = getAdminConfig()
    res.json({ configured: Boolean(config), authenticated: Boolean(readSession(req.headers.cookie, config)) })
})

router.post('/login', sameOrigin, async (req, res) => {
    const config = getAdminConfig()
    if (!config) return res.status(503).json({ error: 'Admin login has not been configured.' })
    const { username, password } = req.body || {}
    if (
        typeof username !== 'string' ||
        username.length > 100 ||
        typeof password !== 'string' ||
        password.length > 256
    ) {
        return res.status(400).json({ error: 'Enter a valid username and password.' })
    }
    const now = Date.now()
    for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key)
    // Vercel supplies this header; local development uses the socket address.
    const ip = process.env.VERCEL ? req.get('x-vercel-forwarded-for') || req.ip : req.ip
    const bucket = attempts.get(ip) || { count: 0, expires: now + 15 * 60 * 1000 }
    if (globalAttempts.expires <= now) globalAttempts = { count: 0, expires: now + 15 * 60 * 1000 }
    if (bucket.count >= 5 || globalAttempts.count >= 30) {
        res.set(
            'Retry-After',
            String(
                Math.max(1, Math.ceil(((bucket.count >= 5 ? bucket : globalAttempts).expires - now) / 1000)),
            ),
        )
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' })
    }
    bucket.count++
    globalAttempts.count++
    attempts.set(ip, bucket)
    const validPassword = await verifyPassword(password, config.passwordHash)
    if (!validPassword || username !== config.username)
        return res.status(401).json({ error: 'Incorrect username or password.' })
    attempts.delete(ip)
    res.cookie(COOKIE_NAME, createSession(config), { ...cookieOptions(req), maxAge: SESSION_SECONDS * 1000 })
    res.json({ authenticated: true })
})

router.post('/logout', sameOrigin, (req, res) => {
    res.clearCookie(COOKIE_NAME, cookieOptions(req))
    res.json({ authenticated: false })
})

router.get('/restaurants', requireAdmin, restaurantQuery(), requireMongo, listRestaurants)
router.use((_req, res) => res.status(404).json({ error: 'Admin endpoint not found.' }))

export default router
