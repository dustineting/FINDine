import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { hasJsonData } from './services/jsonStore.js'
import restaurantRoutes from './routes/restaurants.js'
import adminRoutes from './routes/admin.js'
import managementRoutes from './routes/restaurantManagement.js'
import { fileURLToPath } from 'node:url'

const defaultFrontendDir = fileURLToPath(new URL('../dist/', import.meta.url))

export function createApp({ serveFrontend = false, frontendDir = defaultFrontendDir } = {}) {
    const app = express()
    const api = express.Router()
    app.use(cors())
    app.use(express.json())

    // Authentication and management must run before the public read-only fallback.
    api.use('/admin', adminRoutes)
    api.use('/restaurants', managementRoutes)

    // Pick the data source per request: MongoDB if reachable, otherwise restaurants.json
    api.use(async (_req, res, next) => {
        try {
            await connectDB()
            res.locals.source = 'mongodb'
            next()
        } catch (err) {
            if (hasJsonData()) {
                res.locals.source = 'json'
                return next()
            }
            res.status(503).json({
                error: 'Database unavailable and no restaurants.json found',
                detail: err.message,
            })
        }
    })

    api.use((_req, res, next) => {
        res.set('X-Data-Source', res.locals.source)
        next()
    })

    api.get('/health', (_req, res) => res.json({ ok: true, source: res.locals.source }))
    api.use('/restaurants', restaurantRoutes)
    api.use((_req, res) => res.status(404).json({ error: 'API endpoint not found' }))
    app.use('/api', api)

    // The standalone server serves the build; Vite owns frontend serving in development.
    if (serveFrontend) app.use(express.static(frontendDir))

    app.use((err, _req, res, _next) => {
        if (err.type === 'entity.parse.failed')
            return res.status(400).json({ error: 'Invalid JSON request body.' })
        if (err.type === 'entity.too.large')
            return res.status(413).json({ error: 'Request body is too large.' })
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    })

    return app
}

export default createApp()
