import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { hasJsonData } from './services/jsonStore.js'
import restaurantRoutes from './routes/restaurants.js'

const app = express()

app.use(cors())
app.use(express.json())

// Pick the data source per request: MongoDB if reachable, otherwise restaurants.json
app.use(async (_req, res, next) => {
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

app.use((_req, res, next) => {
    res.set('X-Data-Source', res.locals.source)
    next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true, source: res.locals.source }))
app.use('/api/restaurants', restaurantRoutes)

app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
})

export default app
