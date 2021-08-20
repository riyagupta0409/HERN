import express from 'express'
import { parse } from '../../../utils'
import { stripeWebhookEvents } from './controllers'

const router = express.Router()
router.post('/', parse, stripeWebhookEvents)

export default router
