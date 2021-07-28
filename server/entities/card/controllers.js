import stripe from '../../lib/stripe'
import { isObjectValid } from '../../utils'

export const create = async (req, res) => {
   try {
      const { id } = req.body
      const response = await stripe.customers.createSource(
         id,
         ...(req.body.source && { source: req.body.source })
      )

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}

export const get = async (req, res) => {
   try {
      const { customerId, cardId } = req.query
      const response = await stripe.customers.retrieveSource(customerId, cardId)

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}

export const update = async (req, res) => {
   try {
      const { customerId, cardId, update } = req.body
      const response = await stripe.customers.updateSource(
         customerId,
         cardId,
         update
      )

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}

export const remove = async (req, res) => {
   try {
      const { customerId, cardId } = req.query
      const response = await stripe.customers.deleteSource(customerId, cardId)

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
      const { customerId, limit } = req.query
      const response = await stripe.customers.listSources(customerId, {
         limit,
         object: 'card'
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
