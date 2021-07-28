import stripe from '../../lib/stripe'
import { isObjectValid } from '../../utils'

export const get = async (req, res) => {
   try {
      const { id } = req.params
      const { accountId } = req.query
      let response = null
      if (accountId) {
         response = await stripe.paymentMethods.retrieve(id, {
            stripeAccount: accountId
         })
      } else {
         response = await stripe.paymentMethods.retrieve(id)
      }

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}

export const list = async (req, res) => {
   try {
      const { customer } = req.query
      const response = await stripe.paymentMethods.list({
         customer,
         type: 'card'
      })

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}
