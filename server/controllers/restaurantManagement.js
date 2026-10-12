import { randomUUID } from 'node:crypto'
import Restaurant from '../models/Restaurant.js'

export function restaurantId(req, res, next) {
    if (!/^[a-f\d]{24}$/i.test(req.params.id))
        return res.status(400).json({ error: 'Invalid restaurant ID.' })
    next()
}

function failure(res, error) {
    if (error.code === 11000)
        return res.status(409).json({ error: 'That restaurant identifier already exists.' })
    if (error.name === 'ValidationError')
        return res.status(400).json({ error: 'The restaurant contains invalid values.' })
    res.status(503).json({
        error: 'Unable to save changes in MongoDB. Please retry or refresh the list to check its current state.',
    })
}

export async function createRestaurant(req, res) {
    try {
        const restaurant = await Restaurant.create({
            ...req.restaurantBody,
            restaurant_id: req.restaurantBody.restaurant_id || randomUUID(),
        })
        res.status(201).json({ item: restaurant })
    } catch (error) {
        failure(res, error)
    }
}

export async function updateRestaurant(req, res) {
    const update = { ...req.restaurantBody }
    if (update.address) {
        for (const [key, value] of Object.entries(update.address)) update[`address.${key}`] = value
        delete update.address
    }
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true },
        )
            .maxTimeMS(8000)
            .lean()
        if (!restaurant)
            return res.status(404).json({ error: 'Restaurant no longer exists. Refresh the list.' })
        res.json({ item: restaurant })
    } catch (error) {
        failure(res, error)
    }
}

export async function deleteRestaurant(req, res) {
    try {
        const restaurant = await Restaurant.findByIdAndDelete(req.params.id).maxTimeMS(8000).lean()
        if (!restaurant)
            return res.status(404).json({ error: 'Restaurant no longer exists. Refresh the list.' })
        res.status(204).end()
    } catch (error) {
        failure(res, error)
    }
}
