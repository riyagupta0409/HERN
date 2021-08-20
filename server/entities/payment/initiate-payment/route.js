import express from 'express'

import { initiatePaymentHandler } from './controllers'

const router = express.Router()

router.post('/', initiatePaymentHandler)

export default router
