import { Router } from 'express'
import { requireAdmin, requireMongo, sameOrigin } from '../middleware/admin.js'
import restaurantBody from '../middleware/restaurantBody.js'
import {
    createRestaurant,
    deleteRestaurant,
    restaurantId,
    updateRestaurant,
} from '../controllers/restaurantManagement.js'

const router = Router()
router.post('/', requireAdmin, sameOrigin, restaurantBody, requireMongo, createRestaurant)
router.patch('/:id', requireAdmin, sameOrigin, restaurantId, restaurantBody, requireMongo, updateRestaurant)
router.delete('/:id', requireAdmin, sameOrigin, restaurantId, requireMongo, deleteRestaurant)
export default router
