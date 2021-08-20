import express from 'express'
import { stripeWebhookEvents } from './controllers'

const router = express.Router()
router.post('/', stripeWebhookEvents)

export default router
