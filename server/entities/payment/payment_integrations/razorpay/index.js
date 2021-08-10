import axios from 'axios'
import moment from 'moment'
import Razorpay from 'razorpay'
import { GraphQLClient } from 'graphql-request'

import { CUSTOMER, UPDATE_PAYMENT_RECORD } from '../graphql'

const client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET,
   },
})
const dailykey = new GraphQLClient(process.env.HASURA_KEYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.KEYCLOAK_ADMIN_SECRET,
   },
})

const isObject = input => {
   return !!input && input.constructor === Object
}

export const request = async ({ data = {}, keys = {} }) => {
   try {
      const { id, amount = null, receipt = '', currency = '' } = data

      if (!amount) throw Error('Amount is required!')
      if (!currency) throw Error('Currency is required!')
      if (Object.keys(keys).length === 0) throw Error('Keys are missing!')

      const options = {
         receipt,
         currency,
         payment_capture: 0,
         amount: amount * 100,
      }

      if (!keys.publishable.id) throw Error('Missing razorpay key id!')
      if (!keys.secret.id) throw Error('Missing razorpay key secret!')

      const rzp = new Razorpay({
         key_id: keys.publishable.id,
         key_secret: keys.secret.id,
      })

      const order = await rzp.orders.create(options)

      await client.request(UPDATE_PAYMENT_RECORD, {
         pk_columns: { id },
         _set: {
            paymentRequestId: order.id,
            paymentStatus: 'PROCESSING',
         },
      })

      return order
   } catch (error) {
      const { id } = data
      await client.request(UPDATE_PAYMENT_RECORD, {
         pk_columns: { id },
         _set: { paymentStatus: 'DISCARDED' },
      })
      throw error
   }
}

export const transaction = async ({ data, payment }) => {
   try {
      const { success = true } = data

      const { updatePaymentTransaction } = await client.request(
         UPDATE_PAYMENT_RECORD,
         {
            pk_columns: { id: payment.id },
            _set: {
               paymentStatus: success ? 'SUCCEEDED' : 'FAILED',
               paymentTransactionInfo: data,
               ...(success && {
                  paymentTransactionId: data.razorpay_payment_id,
               }),
            },
         }
      )
      return updatePaymentTransaction
   } catch (error) {
      await client.request(UPDATE_PAYMENT_RECORD, {
         pk_columns: { id: payment.id },
         _set: { paymentStatus: 'DISCARDED' },
      })
      throw error
   }
}

export const requestLink = async args => {
   const { data = {}, keys = {}, callbackUrl = '' } = args
   try {
      const {
         id,
         amount = null,
         currency = '',
         orderCartId: cartId = '',
      } = data

      if (!amount) throw Error('Amount is required!')
      if (!currency) throw Error('Currency is required!')
      if (Object.keys(keys).length === 0) throw Error('Keys are missing!')

      if (!keys.publishable.id) throw Error('Missing razorpay key id!')
      if (!keys.secret.id) throw Error('Missing razorpay key secret!')

      const { customer } = await dailykey.request(CUSTOMER, {
         keycloakId: data.customerKeycloakId,
      })

      const { status, data: response } = await axios.post(
         'https://api.razorpay.com/v1/payment_links',
         {
            currency: currency,
            amount: amount * 100,
            description: 'Payment for cart #' + cartId,
            reference_id: 'CART' + cartId + '-' + id.slice(0, 8),
            customer: {
               ...(isObject(customer)
                  ? {
                       email: customer.email || '',
                       name: customer.fullName || '',
                       contact: customer.phoneNumber || '',
                    }
                  : {
                       name: '',
                       contact: '',
                       email: '',
                    }),
            },
            reminder_enable: true,
            notes: { paymentId: id, cartId },
            notify: { sms: true, email: true },
            ...(callbackUrl.trim() && {
               callback_method: 'get',
               callback_url: callbackUrl.trim(),
            }),
         },
         {
            headers: { 'Content-Type': 'application/json' },
            auth: {
               username: keys.publishable.id,
               password: keys.secret.id,
            },
         }
      )
      if (status === 200) {
         const { id: linkId = '', short_url = '' } = response

         await client.request(UPDATE_PAYMENT_RECORD, {
            pk_columns: { id },
            _set: {
               paymentRequestId: linkId,
               paymentStatus: 'PROCESSING',
               paymentTransactionInfo: {
                  payload: {
                     payment_link: { entity: { short_url: short_url || '' } },
                  },
               },
            },
         })
         return { error: 'Successfully created a payment link' }
      } else {
         return { error: 'Failed to create payment link' }
      }
   } catch (error) {
      const { id } = data
      await client.request(UPDATE_PAYMENT_RECORD, {
         pk_columns: { id },
         _set: { paymentStatus: 'DISCARDED' },
      })
      throw error
   }
}
