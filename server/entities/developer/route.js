import express from "express"
import {WebhookEventRouter} from "./webhookEvents"
const router = express.Router()

console.log("reached route")

router.use('/webhookEvents', WebhookEventRouter)

export default router