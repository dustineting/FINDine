import { Router } from 'express'
import {
    listRestaurants,
    bestRestaurants,
    listBoroughs,
    getStats,
} from '../controllers/restaurantController.js'

const router = Router()

router.get('/', listRestaurants)
router.get('/best', bestRestaurants)
router.get('/boroughs', listBoroughs)
router.get('/stats', getStats)

export default router
