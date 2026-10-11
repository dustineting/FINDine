import Restaurant from '../models/Restaurant.js'
import { markDBFailed } from '../config/db.js'
import {
    hasJsonData,
    listFromJson,
    bestFromJson,
    boroughsFromJson,
    statsFromJson,
} from '../services/jsonStore.js'

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const QUERY_TIMEOUT_MS = 8000

// If a MongoDB query fails, answer from restaurants.json instead of returning a 500
function fallback(res, next, err, fromJson) {
    if (!hasJsonData()) return next(err)
    console.warn(`[db] query failed (${err.message}) — answering from restaurants.json`)
    markDBFailed()
    res.set('X-Data-Source', 'json')
    res.json(fromJson())
}

const PROJECTION = { _id: 0, restaurant_id: 1, name: 1, borough: 1, cuisine: 1, address: 1, grades: 1 }

// GET /api/restaurants?search=&borough=&page=&limit=
// Search matches name OR cuisine; borough filters (groups) the results.
export async function listRestaurants(req, res, next) {
    const { search, borough, limit, page } = req.validatedQuery
    try {
        const filter = {}
        if (res.locals.source === 'json') return res.json(listFromJson({ search, borough, page, limit }))

        if (search.trim()) {
            const rx = new RegExp(escape(search.trim()), 'i')
            filter.$or = [{ name: rx }, { cuisine: rx }]
        }
        if (borough) filter.borough = borough

        const [items, total] = await Promise.all([
            Restaurant.find(filter, PROJECTION)
                .sort({ name: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .maxTimeMS(QUERY_TIMEOUT_MS)
                .lean(),
            Restaurant.countDocuments(filter).maxTimeMS(QUERY_TIMEOUT_MS),
        ])
        res.json({ items, total, page, pages: Math.ceil(total / limit) })
    } catch (err) {
        fallback(res, next, err, () => listFromJson({ search, borough, page, limit }))
    }
}

// GET /api/restaurants/best?search=&limit=
// Restaurants whose aggregated (summed) grade scores exceed 90.
export async function bestRestaurants(req, res, next) {
    const { search, limit } = req.validatedQuery
    try {
        if (res.locals.source === 'json') return res.json(bestFromJson({ search, limit }))

        const match = search.trim() ? { name: new RegExp(escape(search.trim()), 'i') } : {}

        const items = await Restaurant.aggregate([
            { $match: match },
            { $addFields: { totalScore: { $sum: '$grades.score' } } },
            { $match: { totalScore: { $gt: 90 } } },
            { $sort: { totalScore: -1 } },
            { $limit: limit },
            { $project: { ...PROJECTION, totalScore: 1 } },
        ]).option({ maxTimeMS: QUERY_TIMEOUT_MS })
        res.json({ items, total: items.length })
    } catch (err) {
        fallback(res, next, err, () => bestFromJson({ search, limit }))
    }
}

// GET /api/restaurants/boroughs
export async function listBoroughs(_req, res, next) {
    try {
        if (res.locals.source === 'json') return res.json(boroughsFromJson())
        const boroughs = (await Restaurant.distinct('borough').maxTimeMS(QUERY_TIMEOUT_MS)).filter(
            (b) => b && b !== 'Missing',
        )
        res.json(boroughs.sort())
    } catch (err) {
        fallback(res, next, err, boroughsFromJson)
    }
}

// GET /api/restaurants/stats
// Totals for the About section: restaurants, boroughs, cuisines.
export async function getStats(_req, res, next) {
    try {
        if (res.locals.source === 'json') return res.json(statsFromJson())

        const valid = (list) => list.filter((v) => v && v !== 'Missing' && v !== 'Other').length
        const [restaurants, boroughs, cuisines] = await Promise.all([
            Restaurant.estimatedDocumentCount().maxTimeMS(QUERY_TIMEOUT_MS),
            Restaurant.distinct('borough').maxTimeMS(QUERY_TIMEOUT_MS),
            Restaurant.distinct('cuisine').maxTimeMS(QUERY_TIMEOUT_MS),
        ])
        res.json({ restaurants, boroughs: valid(boroughs), cuisines: valid(cuisines) })
    } catch (err) {
        fallback(res, next, err, statsFromJson)
    }
}
