import get from 'lodash/get'
import { client } from '../../../lib/graphql'
// import { GraphQLClient } from 'graphql-request'

import { logger, discardPreviousPaymentMethod } from '../../../utils'
import get_env from '../../../../get_env'
// const client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
//    headers: {
//       'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET
//    }
// })

export const createCustomerPaymentIntent = async (req, res) => {
   console.log('Here')
   try {
      const payload = req.body.event.data.new
      console.log(payload)
      // const { cart = {} } = await client.request(CART, { id: payload.cartId })
      if (payload.id && payload.paymentStatus === 'SUCCEEDED') {
         return res.status(200).json({
            success: true,
            message:
               'Payment attempt cancelled since cart has already been paid!'
         })
      }

      // if (cart.id && cart.paymentStatus === 'SUCCEEDED') {
      //    return res.status(200).json({
      //       success: true,
      //       message:
      //          'Payment attempt cancelled since cart has already been paid!'
      //    })
      // }

      // await client.request(UPDATE_CART, {
      //    id: payload.cartId,
      //    set: { amount: cart.amount + payload.amount }
      // })

      if (payload.isTest || payload.amount === 0) {
         console.log('Test Cart')
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
         console.log('after mutation')
         return res.status(200).json({
            success: true,
            message: 'Payment succeeded!'
         })
      }
      const ORGANIZATION_ID = await get_env('ORGANIZATION_ID')
      if (payload.amount > 0) {
         // const body = {
         //    organizationId: ORGANIZATION_ID,
         //    statementDescriptor: payload.statementDescriptor || '',
         //    cart: {
         //       id: payload.id,
         //       amount: payload.amount,
         //       type: 'cartPayment'
         //    },
         //    customer: {
         //       paymentMethod: payload.paymentMethodId,
         //       stripeCustomerId: payload.stripeCustomerId
         //    }
         // }

         // const {
         //    cart,
         //    customer,
         //    organizationId,
         //    statementDescriptor = ''
         // } = req.body

         // const hardcodedOrganizationId = 239

         // const { organization } = await client.request(ORGANIZATION, {
         //    id: ORGANIZATION_ID //hardcoded orgnizationId to prevent any other payment (like from breezychef)
         // })

         // console.log('organization', organization, cart)

         // const datahub = new GraphQLClient(organization.datahubUrl, {
         //    headers: { 'x-hasura-admin-secret': organization.adminSecret }
         // })

         // if (cart.type && cart.type === 'cartPayment') {
         // const { cartPayment } = await client.request(CART_PAYMENT, {
         //    id: payload.id
         // })
         if (get(payload, 'id') && payload.paymentStatus === 'SUCCEEDED') {
            return res.status(200).json({
               success: true,
               message:
                  "Could not proceed with payment, since cart's payment has already succeeded"
            })
         }
         // } else {
         //    const { cart: orderCart } = await datahub.request(CART, {
         //       id: cart.id
         //    })
         //    if (get(orderCart, 'id') && orderCart.paymentStatus === 'SUCCEEDED') {
         //       return res.status(200).json({
         //          success: true,
         //          message:
         //             "Could not proceed with payment, since cart's payment has already succeeded"
         //       })
         //    }
         // }
         console.log('before discarding')

         await discardPreviousPaymentMethod({
            cartPaymentId: payload.id,
            origin: 'stripe',
            // cartType: cart.type,
            organization: {
               id: ORGANIZATION_ID,
               datahubUrl: organization.datahubUrl,
               adminSecret: organization.adminSecret
            }
         })
         console.log('after discarding')

         const { customerPaymentIntents } = await client.request(
            FETCH_CUSTOMER_PAYMENT_INTENT,
            {
               where: {
                  transferGroup: { _eq: `${payload.id}` },
                  organizationId: { _eq: ORGANIZATION_ID }
               }
            }
         )
         console.log('customerPaymentIntents', customerPaymentIntents)

         if (customerPaymentIntents.length > 0) {
            const [customerPaymentIntent] = customerPaymentIntents

            const result = await client.request(RETRY_CUSTOMER_PAYMENT_INTENT, {
               id: customerPaymentIntent.id,
               _inc: { paymentRetryAttempt: 1 },
               _set: { paymentMethod: customer.paymentMethod }
            })
            return res.json({
               success: true,
               data: result,
               message: 'Payment request has been reattempted'
            })
         } else {
            if (organization.stripeAccountId) {
               const chargeAmount = (payload.amount * 100).toFixed(0)
               const fixedDeduction = organization.chargeFixed * 100
               const percentDeduction =
                  chargeAmount * (organization.chargePercentage / 100)

               const transferAmount = (
                  chargeAmount -
                  fixedDeduction -
                  percentDeduction
               ).toFixed(0)
               console.log('charge', chargeAmount, transferAmount)
               const customerPaymentIntent = await client.request(
                  CREATE_CUSTOMER_PAYMENT_INTENT,
                  {
                     object: {
                        organizationId: ORGANIZATION_ID,
                        statementDescriptor: payload.statementDescriptor,
                        amount: chargeAmount,
                        transferGroup: `${payload.id}`,
                        paymentMethod: customer.paymentMethod,
                        onBehalfOf: organization.stripeAccountId,
                        // type: cart.type ? cart.type : 'cart',
                        stripeCustomerId: customer.stripeCustomerId,
                        currency: organization.currency.toLowerCase(),
                        stripeAccountType: organization.stripeAccountType,
                        ...(organization.stripeAccountType === 'express' && {
                           organizationTransfers: {
                              data: {
                                 amount: transferAmount,
                                 transferGroup: `${payload.id}`,
                                 destination: organization.stripeAccountId
                              }
                           }
                        })
                     }
                  }
               )

               return res.json({
                  success: true,
                  data: { customerPaymentIntent },
                  message: 'Payment request has been initiated!'
               })
            } else {
               logger(
                  '/api/initiate-payment',
                  "Your account doesn't have stripe linked!"
               )
               return res.status(403).json({
                  success: false,
                  error: "Your account doesn't have stripe linked!"
               })
            }
         }
      }
   } catch (error) {
      logger('/api/initiate-payment', error)
      return res.status(500).json({ success: false, error: error.message })
   }
}

const ORGANIZATION = `
   query organization($id: Int!) {
      organization(id: $id) {
         id
         currency
         datahubUrl
         adminSecret
         chargeFixed
         chargeCurrency
         stripeAccountId
         chargePercentage
         stripeAccountType
      }
   }
`

const FETCH_CUSTOMER_PAYMENT_INTENT = `
   query customerPaymentIntents(
      $where: stripe_customerPaymentIntent_bool_exp!
   ) {
      customerPaymentIntents_(where: $where) {
         id
      }
   }
`

const CREATE_CUSTOMER_PAYMENT_INTENT = `
   mutation createCustomerPaymentIntent($object: stripe_customerPaymentIntent_insert_input!) {
      createCustomerPaymentIntent_(object: $object) {
         id
      }
   }
`
const RETRY_CUSTOMER_PAYMENT_INTENT = `
   mutation updateCustomerPaymentIntent(
      $id: uuid!
      $_set: stripe_customerPaymentIntent_set_input!
      $_inc: stripe_customerPaymentIntent_inc_input!
   ) {
      updateCustomerPaymentIntent_(
         pk_columns: { id: $id }
         _inc: $_inc
         _set: $_set
      ) {
         id
         amount
         invoiceSendAttempt
         amount
         created_at
         currency
         onBehalfOf
         paymentMethod
         paymentRetryAttempt
         statementDescriptor
         status
         stripeAccountType
         stripeCustomerId
         stripeInvoiceId
         stripePaymentIntentId
         transferGroup
      }
   }
`

const CART = `
   query cart($id: Int!) {
      cart(id: $id) {
         id
         paymentStatus
      }
   }
`
const CART_PAYMENT = `
   query CART_PAYMENT($id: Int!) {
      cartPayment(id: $id) {
      id
      cartId
      paymentStatus
      }
   }

`

const UPDATE_CART_PAYMENT = `
mutation UPDATE_CART_PAYMENT($id: Int!, $_inc: order_cartPayment_inc_input, $_set: order_cartPayment_set_input) {
   updateCartPayment(pk_columns: {id: $id}, _inc: $_inc, _set: $_set) {
     cartId
     id
     paymentStatus
     paymentRetryAttempt
   }
 }
`
