import axios from 'axios'
import stripe from '../../../lib/stripe'
import { isObjectValid } from '../../../utils'

import { UPDATE_CONSUMER } from './graphql'

export const create = async (req, res) => {
   try {
      const args = {
         email: req.body.event.new.email,
         phone: req.body.event.new.phone,
         name: req.body.event.new.firstName + req.body.event.new.lastName
      }
      const response = await stripe.customers.create(args)

      if (isObjectValid(response)) {
         await axios.post(process.env.HASURA_KEYCLOAK_URL, {
            query: UPDATE_CONSUMER,
            variables: {
               keycloackId: req.body.event.new.keycloackId,
               stripeCustomerId: response.id
            }
         })
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
      const { id } = req.params
      const response = await stripe.customers.update(id, {
         ...req.body
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

export const remove = async (req, res) => {
   try {
      const { id } = req.params
      const response = await stripe.customers.del(id)

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
      const { id } = req.params
      const response = await stripe.customers.retrieve(id)

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
      const response = await stripe.customers.list(req.query)

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}
