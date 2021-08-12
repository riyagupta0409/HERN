import { client } from '../../../lib/graphql'
import { logger } from '../../../utils'
import { createPaymentIntent } from '../functions'
import { UPDATE_CART_PAYMENT } from '../graphql'

export const initiatePaymentHandler = async (req, res) => {
   try {
      const payload = req.body.event.data.new

      if (payload.id && payload.paymentStatus === 'SUCCEEDED') {
         return res.status(200).json({
            success: true,
            message:
               'Payment attempt cancelled since cart has already been paid!'
         })
      }

      if (payload.isTest || payload.amount === 0) {
         await client.request(UPDATE_CART_PAYMENT, {
            id: payload.id,
            _set: {
               paymentStatus: 'SUCCEEDED',
               isTest: true,
               transactionId: 'NA',
               transactionRemark: {
                  id: 'NA',
                  amount: payload.amount,
                  message: 'payment bypassed',
                  reason: payload.isTest ? 'test mode' : 'amount 0 - free'
               }
            }
         })
         return res.status(200).json({
            success: true,
            message: 'Payment succeeded!'
         })
      }
      if (payload.amount > 0) {
         if (payload.paymentType === 'stripe') {
            // call the stripe payment intent method
            const result = await createPaymentIntent({
               ...payload,
               oldAmount: req.body.event.data.old.amount
            })
            if (result.success) {
               res.status(200).json(result)
            } else {
               res.status(500).json(result)
            }
         }
      }
   } catch (error) {
      logger('/api/payment-intent', error)
      return res.status(500).json({ success: false, error })
   }
}
