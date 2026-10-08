import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Fallback data source: server/data/restaurants.json
// Accepts a JSON array or mongoexport output (one document per line, with {"$date": ...} values).
const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/restaurants.json')

let cache = null

const reviveDate = (d) =>
    d && typeof d === 'object' && '$date' in d
        ? d.$date.$numberLong
            ? Number(d.$date.$numberLong)
            : d.$date
        : d

function normalize(doc) {
    const { _id, ...rest } = doc
    return { ...rest, grades: (rest.grades || []).map((g) => ({ ...g, date: reviveDate(g.date) })) }
}

export function hasJsonData() {
    return fs.existsSync(FILE)
}

function loadRestaurants() {
    if (cache) return cache
    const raw = fs.readFileSync(FILE, 'utf8').trim()
    const docs = raw.startsWith('[')
        ? JSON.parse(raw)
        : raw
              .split(/\r?\n/)
              .filter(Boolean)
              .map((l) => JSON.parse(l))
    cache = docs.map(normalize)
    console.log(`[json] loaded ${cache.length} restaurants from restaurants.json`)
    return cache
}

const contains = (value, q) => (value || '').toLowerCase().includes(q)
const totalScore = (r) => (r.grades || []).reduce((sum, g) => sum + (g.score ?? 0), 0)

export function listFromJson({ search, borough, page, limit }) {
    const q = search.trim().toLowerCase()
    const all = loadRestaurants()
        .filter((r) => !q || contains(r.name, q) || contains(r.cuisine, q))
        .filter((r) => !borough || r.borough === borough)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return {
        items: all.slice((page - 1) * limit, page * limit),
        total: all.length,
        page,
        pages: Math.ceil(all.length / limit),
    }
}

export function bestFromJson({ search, limit }) {
    const q = search.trim().toLowerCase()
    const items = loadRestaurants()
        .filter((r) => !q || contains(r.name, q))
        .map((r) => ({ ...r, totalScore: totalScore(r) }))
        .filter((r) => r.totalScore > 90)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
    return { items, total: items.length }
}

export function boroughsFromJson() {
    return [...new Set(loadRestaurants().map((r) => r.borough))].filter((b) => b && b !== 'Missing').sort()
}

export function statsFromJson() {
    const all = loadRestaurants()
    const distinct = (key) =>
        new Set(all.map((r) => r[key]).filter((v) => v && v !== 'Missing' && v !== 'Other')).size
    return { restaurants: all.length, boroughs: distinct('borough'), cuisines: distinct('cuisine') }
}
