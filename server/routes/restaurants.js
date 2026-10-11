import { Router } from 'express'
import restaurantQuery from '../middleware/restaurantQuery.js'
import {
    listRestaurants,
    bestRestaurants,
    listBoroughs,
    getStats,
} from '../controllers/restaurantController.js'

const router = Router()

router.get('/', restaurantQuery(), listRestaurants)
router.get('/best', restaurantQuery({ best: true }), bestRestaurants)
router.get('/boroughs', listBoroughs)
router.get('/stats', getStats)

export default router
