import { Router } from 'express'
import {handleIsActiveEventTrigger , sendWebhookEvents } from './controllers'


const router = Router();

/*
req url :  api/handleWebhookEvents/create-delete-event-trigger
*/

router.post('/create-delete-event-trigger' , handleIsActiveEventTrigger)

router.post('/sendWebhookEvents' , sendWebhookEvents)

export default router 

