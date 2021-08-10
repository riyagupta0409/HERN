import { GraphQLClient } from 'graphql-request'

import { logger } from '../../../utils'

const dailycloak = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET
   }
})

const dailykey = new GraphQLClient(process.env.HASURA_KEYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.KEYCLOAK_ADMIN_SECRET
   }
})

export const sendSMS = async (req, res) => {
   try {
      const { paymentMethod, transactionRemark = {} } = req.body.event.data.new
      const { paymentMethod: method = {} } = await dailykey.request(
         PAYMENT_METHOD,
         {
            stripePaymentMethodId: paymentMethod
         }
      )

      const customer = {
         name: '',
         phoneNo: ''
      }
      if (method.customer) {
         if (method.customer.firstName) {
            customer.name = method.customer.firstName
         }
         if (method.customer.lastName) {
            customer.name += ' ' + method.customer.lastName
         }
         if (method.customer.phoneNumber) {
            customer.phoneNo = method.customer.phoneNumber
         }
      }

      if (!customer.phoneNo) throw Error('Phone number is required!')

      const organization = {
         id: null,
         name: '',
         adminSecret: null,
         datahubUrl: null
      }

      if (
         method.customerByClient &&
         'organizationId' in method.customerByClient &&
         method.customerByClient.organizationId
      ) {
         organization.id = method.customerByClient.organizationId
      }

      if (organization.id) {
         const { organization: org = {} } = await dailycloak.request(
            ORGANIZATION,
            {
               id: organization.id
            }
         )
         if ('name' in org && org.name) {
            organization.name = org.name
         }
         if ('adminSecret' in org && org.adminSecret) {
            organization.adminSecret = org.adminSecret
         }
         if ('datahubUrl' in org && org.datahubUrl) {
            organization.datahubUrl = org.datahubUrl
         }
      }

      let action_url = ''
      if (
         transactionRemark &&
         Object.keys(transactionRemark).length > 0 &&
         transactionRemark.next_action
      ) {
         if (transactionRemark.next_action.type === 'use_stripe_sdk') {
            action_url = transactionRemark.next_action.use_stripe_sdk.stripe_js
         } else {
            action_url = transactionRemark.next_action.redirect_to_url.url
         }
      }

      if (!action_url) {
         return res
            .status(200)
            .json({ success: true, message: 'Action url is missing!' })
      }

      let orderId = null
      if (
         transactionRemark.id &&
         organization.datahubUrl &&
         organization.adminSecret
      ) {
         const { customerPaymentIntents = [] } = await dailycloak.request(
            CUSTOMER_PAYMENT_INTENTS,
            {
               where: {
                  stripePaymentHistories: {
                     stripePaymentIntentId: {
                        _eq: transactionRemark.id
                     }
                  }
               }
            }
         )
         if (customerPaymentIntents.length > 0) {
            const [intent] = customerPaymentIntents
            if ('cartId' in intent && intent.cartId) {
               const datahub = new GraphQLClient(organization.datahubUrl, {
                  headers: {
                     'x-hasura-admin-secret': organization.adminSecret
                  }
               })
               const { cart = {} } = await datahub.request(CART, {
                  id: intent.cartId
               })
               if ('orderId' in cart && cart.orderId) {
                  orderId = cart.orderId
               }
            }
         }
      }

      const sms = await dailycloak.request(SEND_SMS, {
         phone: `+91${customer.phoneNo}`,
         message: `Dear ${
            customer.name.trim() ? customer.name : 'customer'
         }, your payment requires additional action${
            orderId && ` for ORDER #${orderId}`
         }, please use the following link to complete your payment.
Link: ${action_url}

From,
${organization.name}
`
      })
      if (sms.success) {
         return res
            .status(200)
            .json({ success: true, message: 'SMS sent successfully' })
      }
      return res.status(200).json({ success: true })
   } catch (error) {
      logger('/api/webhooks/stripe/send-sms', error)
      return res.status(500).json({ success: false, error })
   }
}

const SEND_SMS = `
   mutation sendSMS($message: String!, $phone: String!) {
      sendSMS(message: $message, phone: $phone) {
         success
         message
      }
   }
`

const PAYMENT_METHOD = `
   query paymentMethod($stripePaymentMethodId: String!) {
      paymentMethod: platform_stripePaymentMethod(
         stripePaymentMethodId: $stripePaymentMethodId
      ) {
         stripePaymentMethodId
         customer {
            phoneNumber
            firstName
            lastName
         }
         customerByClient {
            organizationId
         }
      }
   }
`

const ORGANIZATION = `
   query organization($id: Int!) {
      organization(id: $id) {
         id
         datahubUrl
         adminSecret
         name: organizationName
      }
   }
`

const CUSTOMER_PAYMENT_INTENTS = `
   query customerPaymentIntents(
      $where: stripe_customerPaymentIntent_bool_exp = {}
   ) {
      customerPaymentIntents(where: $where) {
         id
         cartId: transferGroup
      }
   }
`

const CART = `
   query cart($id: Int!) {
      cart(id: $id) {
         id
         source
         orderId
      }
   }
`
