import axios from 'axios'
import moment from 'moment'
import get from 'lodash.get'
import { GraphQLClient } from 'graphql-request'

import {
   CART,
   PAYMENT,
   UPDATE_CART,
   PAYMENT_PARTNERSHIP,
   INSERT_PAYMENT_RECORD,
   UPDATE_PAYMENT_RECORD
} from './graphql'
import { discardPreviousPaymentMethod, logger } from '../../../utils'
import * as razorpay from './razorpay'

const client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET
   }
})

export const initiate = async (req, res) => {
   try {
      const {
         version = '',
         cartId = '',
         amount = null,
         keycloakId = null,
         partnershipId = null
      } = req.body

      if (!partnershipId) throw Error('Missing partnership id!')
      if (!amount) throw Error('Amount is required!')
      if (amount <= 0) throw Error('Amount must be greater than 0!')
      if (!keycloakId) throw Error('Missing customer user id!')

      const { partnership = null } = await client.request(PAYMENT_PARTNERSHIP, {
         id: partnershipId
      })

      if (partnership.organization) {
         await discardPreviousPaymentMethod({
            cartId,
            organization: partnership.organization
         })
      }

      if (!partnership) throw Error('Partnership does not exist!')

      const { insertPaymentRecord } = await client.request(
         INSERT_PAYMENT_RECORD,
         {
            object: {
               amount,
               version,
               orderCartId: cartId,
               paymentStatus: 'PENDING',
               paymentRequestInfo: req.body,
               customerKeycloakId: keycloakId,
               paymentPartnershipId: partnership.id,
               ...(partnership.isPayoutRequired
                  ? { payouts: { data: {} } }
                  : { commissions: { data: {} } })
            }
         }
      )

      return res.status(200).json({ success: true, data: insertPaymentRecord })
   } catch (error) {
      logger('/api/payment/request/initiate', JSON.stringify(error))
      return res.status(400).json({ success: false, error: error.message })
   }
}

export const processRequest = async (req, res) => {
   try {
      const { paymentPartnershipId, version = '' } = req.body.event.data.new

      if (version !== 'v2')
         return res
            .status(400)
            .json({ success: false, error: 'API version mismatch.' })

      const { partnership = null } = await client.request(PAYMENT_PARTNERSHIP, {
         id: paymentPartnershipId
      })

      const { callbackUrl = '', company = null } = partnership

      if (!company)
         throw Error('No payment provider linked with this partnership!')

      if (!partnership.publishableConfig) {
         throw Error('Publishable keys are required!')
      }
      if (Object.keys(partnership.publishableConfig).length === 0) {
         throw Error('Publishable keys are required!')
      }
      if (!partnership.secretConfig) {
         throw Error('Secret keys are required!')
      }
      if (Object.keys(partnership.secretConfig).length === 0) {
         throw Error('Secret keys are required!')
      }

      const { type = '', identifier } = company

      if (!identifier in providers)
         throw Error('Missing integration with this payment provider')

      let request = {}

      request = await providers[identifier].request({
         keys: {
            publishable: partnership.publishableConfig,
            secret: partnership.secretConfig
         },
         ...(type === 'Payment Links' && {
            callbackUrl: callbackUrl || ''
         }),
         data: { ...req.body.event.data.new, currency: partnership.currency }
      })

      return res.status(200).json({ success: true, data: request })
   } catch (error) {
      logger('/api/payment/request/process', error)
      return res.status(400).json({ success: false, error: error.message })
   }
}

export const processTransaction = async (req, res) => {
   try {
      const { paymentId = '' } = req.body

      if (!paymentId) throw Error('Payment id is required!')

      const { payment = null } = await client.request(PAYMENT, {
         id: paymentId
      })

      if (!payment) throw Error('No such payment exists!')

      const { partnership: { company: { identifier = '' } = {} } = {} } =
         payment

      if (!identifier) throw Error('Payment integration is not mapped yet!')

      let transaction

      transaction = await providers[identifier].transaction({
         data: req.body,
         payment
      })
      return res.status(200).json({ success: true, data: { transaction } })
   } catch (error) {
      logger('/api/payment/transaction/process', JSON.stringify(error))
      return res.status(400).json({ success: false, error: error.message })
   }
}

export const handleCart = async (req, res) => {
   try {
      const {
         id,
         version,
         orderCartId,
         paymentStatus,
         isAutoCancelled,
         paymentRequestInfo,
         paymentPartnershipId,
         paymentTransactionId,
         paymentTransactionInfo
      } = req.body.event.data.new

      if (version !== 'v2')
         return res
            .status(400)
            .json({ success: false, error: 'API version mismatch.' })

      if (isAutoCancelled)
         return res.status(200).json({
            success: false,
            error: 'Aborting early since payment has been cancelled automatically.'
         })

      const { partnership } = await client.request(PAYMENT_PARTNERSHIP, {
         id: paymentPartnershipId
      })

      if (!get(partnership, 'id'))
         throw Error('No payment provider linked with this partnership!')
      if (!get(partnership, 'organization.id'))
         throw Error('No organization is linked with partnership!')
      if (!get(partnership, 'organization.datahubUrl'))
         throw Error('Missing datahub url!')
      if (!get(partnership, 'organization.adminSecret'))
         throw Error('Missing admin secret!')

      const { datahubUrl = '', adminSecret = '' } = partnership.organization
      const datahub = new GraphQLClient(datahubUrl, {
         headers: { 'x-hasura-admin-secret': adminSecret }
      })

      const { cart } = await datahub.request(CART, { id: orderCartId })

      if (get(cart, 'id') && cart.paymentStatus === 'SUCCEEDED') {
         return res.status(200).json({
            success: true,
            message:
               "Could not update the cart, since cart's payment has succeeded"
         })
      }

      await datahub.request(UPDATE_CART, {
         id: orderCartId,
         _set: {
            ...(['DISCARDED', 'CANCELLED'].includes(paymentStatus)
               ? {
                    paymentId: null,
                    transactionId: null,
                    paymentStatus: 'PENDING',
                    paymentRequestInfo: null,
                    paymentUpdatedAt: null,
                    transactionRemark: null
                 }
               : {
                    paymentId: id,
                    paymentStatus,
                    paymentRequestInfo,
                    transactionId: paymentTransactionId,
                    paymentUpdatedAt: moment().toISOString(),
                    transactionRemark: paymentTransactionInfo
                 })
         }
      })

      return res.status(200).json({ success: true, message: 'Cart updated!' })
   } catch (error) {
      logger('/api/payment/cart', JSON.stringify(error))
      return res.status(400).json({ success: false, error: error.message })
   }
}

export const discard = async (req, res) => {
   try {
      const { paymentId = '' } = req.body
      if (!paymentId) throw Error('Payment Id is required!')

      const { payment } = await client.request(PAYMENT, { id: paymentId })
      let type = get(payment, 'partnership.company.type')

      if (
         type === 'Payment Links' &&
         payment.paymentRequestId &&
         payment.paymentRequestId.startsWith('plink')
      ) {
         let clientId = get(payment, 'partnership.clientId')
         let secretId = get(payment, 'partnership.secretId')

         if (clientId && secretId) {
            const URL = `https://api.razorpay.com/v1/payment_links/${payment.paymentRequestId}/cancel`
            const auth = { username: clientId, password: secretId }
            const headers = { 'Content-type': 'application/json' }
            axios.post(URL, {}, { auth, headers })
         }
      }

      await client.request(UPDATE_PAYMENT_RECORD, {
         pk_columns: { id: paymentId },
         _set: { paymentStatus: 'DISCARDED' }
      })
      return res.status(200).json({
         success: true,
         message: 'Payment attempt has been discarded.'
      })
   } catch (error) {
      logger('/api/payment/discard', JSON.stringify(error))
      return res.status(400).json({ success: false, error: error.message })
   }
}

const providers = {
   '924bf963-28e6-4cdb-9773-0df63d04a89c': {
      request: razorpay.request,
      transaction: razorpay.transaction
   },
   'aa3caaf0-b91a-4de9-a4d8-a67644cd28c6': {
      request: razorpay.requestLink
   }
}
