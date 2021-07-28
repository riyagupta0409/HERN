import express from 'express'

import {
   MOFRouter,
   MenuRouter,
   UserRouter,
   OrderRouter,
   sendMail,
   DeviceRouter,
   UploadRouter,
   RMKMenuRouter,
   initiatePayment,
   OccurenceRouter,
   WorkOrderRouter,
   NotificationRouter,
   RewardsRouter,
   ModifierRouter,
   emailParser,
   ParseurRouter,
   placeAutoComplete,
   placeDetails,
   StoreRouter,
   getDistance,
   authorizeRequest,
   handleImage,
   GetFullOccurenceRouter,
   populate_env,
   ActionsRouter,
   LogRouter,
   CardRouter,
   RefundRouter,
   CustomerRouter,
   SetupIntentRouter,
   PaymentMethodRouter,
   PaymentIntentRouter,
   PaymentRouter,
   createStripeCustomer,
   createStripeCustomer2,
   sendStripeInvoice,
   sendSMS,
   getBalance,
   getAccountId,
   createCustomer,
   createLoginLink,
   createCustomerByClient,
   createCustomerPaymentIntent,
   updateDailyosStripeStatus,
   getAccountDetails
} from './entities'
import { PrintRouter } from './entities/print'
import {
   printKOT,
   getKOTUrls,
   printLabel,
   handleThirdPartyOrder
} from './entities/events'
import {
   handleCustomerSignup,
   handleSubscriptionCancelled
} from './entities/emails'

const router = express.Router()

// Routes
router.get('/api/about', (req, res) => {
   res.json({ about: 'This is express server API!' })
})
router.use('/api/logs', LogRouter)
router.use('/api/mof', MOFRouter)
router.use('/api/menu', MenuRouter)
router.use('/api/order', OrderRouter)
router.use('/api/assets', UploadRouter)
router.use('/api/printer', PrintRouter)
router.use('/api/rmk-menu', RMKMenuRouter)
router.use('/api/inventory', WorkOrderRouter)
router.post('/api/initiate-payment', initiatePayment)
router.get('/api/place/autocomplete/json', placeAutoComplete)
router.get('/api/place/details/json', placeDetails)
router.post('/api/distance-matrix', getDistance)
router.post('/api/sendmail', sendMail)
router.use('/api/rewards', RewardsRouter)
router.get('/api/kot-urls', getKOTUrls)
router.use('/api/modifier', ModifierRouter)
router.use('/api/parseur', ParseurRouter)
router.use('/api/occurences', GetFullOccurenceRouter)
router.use('/api/customer', CustomerRouter)
router.use('/api/actions', ActionsRouter)

// NEW
router.use('/api/card', CardRouter)
router.use('/api/refund', RefundRouter)
router.use('/api/customer', CustomerRouter)
router.use('/api/setup-intent', SetupIntentRouter)
router.use('/api/payment-method', PaymentMethodRouter)
router.use('/api/payment-intent', PaymentIntentRouter)
router.use('/api/payment', PaymentRouter)

router.get('/api/balance', getBalance)
router.get('/api/account-id', getAccountId)
router.get('/api/login-link', createLoginLink)
router.get('/api/account-details/:id', getAccountDetails)
router.post('/api/initiate-stripe-payment', createCustomerPaymentIntent)

router.post('/api/webhooks/customer', createCustomer)
router.post('/api/webhooks/customer-by-client', createCustomerByClient)
router.post('/api/webhooks/dailyos-stripe-status', updateDailyosStripeStatus)
router.post('/api/webhooks/stripe/customer', createStripeCustomer)
router.post('/api/webhooks/stripe/customer/create', createStripeCustomer2)
router.post('/api/webhooks/stripe/send-invoice', sendStripeInvoice)
router.post('/api/webhooks/stripe/send-sms', sendSMS)
// NEW

router.use('/webhook/user', UserRouter)
router.use('/webhook/devices', DeviceRouter)
router.use('/webhook/notification', NotificationRouter)
router.use('/webhook/occurence', OccurenceRouter)
router.post('/webhook/parse/email', emailParser)
router.post('/webhook/authorize-request', authorizeRequest)

router.post('/event/print-label', printLabel)
router.post('/event/print-kot', printKOT)
router.post('/event/order/third-party', handleThirdPartyOrder)

router.post('/webhook/emails/handle-customer-signup', handleCustomerSignup)
router.post(
   '/webhook/emails/handle-subscription-cancelled',
   handleSubscriptionCancelled
)

router.use('/api/store', StoreRouter)
router.post('/api/envs', populate_env)

router.get('/images/:url(*)', handleImage)

export default router
