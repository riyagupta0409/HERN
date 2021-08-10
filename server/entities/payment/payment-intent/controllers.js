import { GraphQLClient } from 'graphql-request'
import getKeyValue from 'lodash/get'
import stripe from '../../../lib/stripe'
import { isObjectValid, logger } from '../../../utils'

const client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET
   }
})

const STATUS = {
   requires_payment_method: 'REQUIRES_PAYMENT_METHOD',
   requires_action: 'REQUIRES_ACTION',
   processing: 'PROCESSING',
   canceled: 'CANCELLED',
   succeeded: 'SUCCEEDED'
}

const ORGANIZATION = `
   query organization($id: Int!) {
      organization(id: $id) {
         id
         datahubUrl
         adminSecret
         organizationUrl
         stripeAccountId
         organizationName
         stripeAccountType
      }
   }
`

const DAILYCLOAK_INSERT_STRIPE_PAYMENT_HISTORY = `
   mutation insertStripePaymentHistory(
      $objects: [stripe_stripePaymentHistory_insert_input!]!
   ) {
      insertStripePaymentHistory: insert_stripe_stripePaymentHistory(
         objects: $objects
      ) {
         affected_rows
      }
   }
`

const DATAHUB_INSERT_STRIPE_PAYMENT_HISTORY = `
   mutation insertStripePaymentHistory(
      $objects: [order_stripePaymentHistory_insert_input!]!
   ) {
      insertStripePaymentHistory: insert_order_stripePaymentHistory(
         objects: $objects
      ) {
         affected_rows
      }
   }
`

const UPDATE_CUSTOMER_PAYMENT_INTENT = `
   mutation updateCustomerPaymentIntent(
      $id: uuid!
      $_set: stripe_customerPaymentIntent_set_input = {}
   ) {
      updateCustomerPaymentIntent(pk_columns: { id: $id }, _set: $_set) {
         id
      }
   }
`

const UPDATE_CART = `
   mutation updateCart(
      $pk_columns: order_cart_pk_columns_input!
      $_set: order_cart_set_input = {}
   ) {
      updateCart(pk_columns: $pk_columns, _set: $_set) {
         id
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
      paymentId
      stripeInvoiceId
      paymentRetryAttempt
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

export const create = async (req, res) => {
   try {
      const {
         id,
         amount,
         currency,
         onBehalfOf,
         transferGroup,
         paymentMethod,
         organizationId,
         stripeInvoiceId,
         requires3dSecure,
         stripeCustomerId,
         stripeAccountType,
         statementDescriptor,
         type
      } = req.body.event.data.new
      const hardcodedOrganizationId = 239
      const { organization } = await client.request(ORGANIZATION, {
         id: hardcodedOrganizationId
      })

      const datahub = new GraphQLClient(organization.datahubUrl, {
         headers: { 'x-hasura-admin-secret': organization.adminSecret }
      })

      if (type === 'cartPayment') {
         const { cartPayment } = await datahub.request(CART_PAYMENT, {
            id: Number(transferGroup)
         })

         if (
            getKeyValue(cartPayment, 'id') &&
            cartPayment.paymentStatus === 'SUCCEEDED'
         ) {
            return res.status(200).json({
               success: true,
               message:
                  "Could not create payment intent or invoice, since cart's payment has already succeeded"
            })
         }
      } else {
         const { cart } = await datahub.request(CART, {
            id: Number(transferGroup)
         })

         if (get(cart, 'id') && cart.paymentStatus === 'SUCCEEDED') {
            return res.status(200).json({
               success: true,
               message:
                  "Could not create payment intent or invoice, since cart's payment has already succeeded"
            })
         }
      }

      if (stripeAccountType === 'standard') {
         // RE ATTEMPT
         let previousInvoice = null
         if (stripeInvoiceId) {
            previousInvoice = await stripe.invoices.retrieve(stripeInvoiceId, {
               stripeAccount: organization.stripeAccountId
            })
            const isValidForReattempt = [
               previousInvoice,
               previousInvoice && previousInvoice.status !== 'void',
               req.body.event.data.new.amount === req.body.event.data.old.amount
            ].every(node => node)

            if (!requires3dSecure && isValidForReattempt) {
               const invoice = await stripe.invoices.pay(
                  stripeInvoiceId,
                  { payment_method: paymentMethod },
                  { stripeAccount: organization.stripeAccountId }
               )
               await handleInvoice({ invoice, datahub })

               if (invoice.payment_intent) {
                  const intent = await stripe.paymentIntents.retrieve(
                     invoice.payment_intent,
                     { stripeAccount: organization.stripeAccountId }
                  )
                  await handlePaymentIntent({
                     intent,
                     datahub,
                     stripeAccountId: organization.stripeAccountId
                  })
               }
               return res.status(200).json({
                  success: true,
                  data: invoice,
                  message: 'Payment has been reattempted'
               })
            }
         }

         if (previousInvoice && stripeInvoiceId) {
            await stripe.invoices.voidInvoice(stripeInvoiceId, {
               stripeAccount: organization.stripeAccountId
            })
         }
         // CREATE NEW INVOICE
         const item = await stripe.invoiceItems.create(
            {
               amount,
               currency,
               customer: stripeCustomerId,
               description: 'Weekly Subscription'
            },
            { stripeAccount: organization.stripeAccountId }
         )

         if (requires3dSecure) {
            console.log('REQUIRES 3D SECURE')
         }
         const invoice = await stripe.invoices.create(
            {
               customer: stripeCustomerId,
               default_payment_method: paymentMethod,
               statement_descriptor:
                  statementDescriptor || organization.organizationName,
               ...(requires3dSecure && {
                  payment_settings: {
                     payment_method_options: {
                        card: {
                           request_three_d_secure: 'any'
                        }
                     }
                  }
               }),
               metadata: {
                  organizationId,
                  cartId: transferGroup,
                  type,
                  customerPaymentIntentId: id,
                  stripeAccountId: organization.stripeAccountId
               }
            },
            { stripeAccount: organization.stripeAccountId }
         )
         await handleInvoice({ invoice, datahub })

         const finalizedInvoice = await stripe.invoices.finalizeInvoice(
            invoice.id,
            { stripeAccount: organization.stripeAccountId }
         )
         await handleInvoice({ invoice: finalizedInvoice, datahub })

         const result = await stripe.invoices.pay(finalizedInvoice.id, {
            stripeAccount: organization.stripeAccountId
         })
         await handleInvoice({ invoice: result, datahub })

         if (result.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
               result.payment_intent,
               { stripeAccount: organization.stripeAccountId }
            )
            await handlePaymentIntent({
               datahub,
               intent: paymentIntent,
               stripeAccountId: organization.stripeAccountId
            })
         }
         return res.status(200).json({
            data: result,
            success: true,
            message: 'New invoice payment has been made'
         })
      } else {
         const intent = await stripe.paymentIntents.create({
            amount,
            currency,
            confirm: true,
            on_behalf_of: onBehalfOf,
            customer: stripeCustomerId,
            payment_method: paymentMethod,
            transfer_group: transferGroup,
            statement_descriptor:
               statementDescriptor || organization.organizationName,
            return_url: `https://${organization.organizationUrl}/store/paymentProcessing`
         })
         if (intent && intent.id) {
            await client.request(UPDATE_CUSTOMER_PAYMENT_INTENT, {
               id,
               _set: {
                  transactionRemark: intent,
                  status: STATUS[intent.status],
                  stripePaymentIntentId: intent.id
               }
            })

            await client.request(DAILYCLOAK_INSERT_STRIPE_PAYMENT_HISTORY, {
               objects: [
                  {
                     status: intent.status,
                     type: 'PAYMENT_INTENT',
                     stripePaymentIntentId: intent.id,
                     transactionRemark: intent,
                     customerPaymentIntentId: id
                  }
               ]
            })
            if (type === 'cartPayment') {
               await datahub.request(UPDATE_CART_PAYMENT, {
                  id: transferGroup,
                  _set: {
                     transactionId: intent.id,
                     transactionRemark: intent,
                     paymentStatus: STATUS[intent.status]
                  }
               })
            } else {
               await datahub.request(UPDATE_CART, {
                  pk_columns: { id: transferGroup },
                  _set: {
                     transactionId: intent.id,
                     transactionRemark: intent,
                     paymentStatus: STATUS[intent.status]
                  }
               })
            }

            let datahub_history_objects = []

            if (
               invoice.metadata.type &&
               invoice.metadata.type === 'cartPayment'
            ) {
               datahub_history_objects = [
                  {
                     cartPaymentId: transferGroup,
                     status: intent.status,
                     type: 'PAYMENT_INTENT',
                     transactionId: intent.id,
                     transactionRemark: intent
                  }
               ]
            } else {
               datahub_history_objects = [
                  {
                     cartId: transferGroup,
                     status: intent.status,
                     type: 'PAYMENT_INTENT',
                     transactionId: intent.id,
                     transactionRemark: intent
                  }
               ]
            }

            await datahub.request(DATAHUB_INSERT_STRIPE_PAYMENT_HISTORY, {
               objects: datahub_history_objects
            })

            return res.status(200).json({
               success: true,
               data: intent
            })
         } else {
            throw Error('Failed to create payment intent!')
         }
      }
   } catch (error) {
      logger('/api/payment-intent', error)
      return res.status(500).json({ success: false, error })
   }
}

export const retry = async (req, res) => {
   try {
      const { invoiceId, stripeAccountId } = req.body
      if (!invoiceId) throw Error('Invoice ID is required!')

      const stripeAccount = stripeAccountId

      const invoice = await stripe.invoices.retrieve(invoiceId, {
         stripeAccount
      })

      const { organization } = await client.request(ORGANIZATION, {
         id: invoice.metadata.organizationId
      })

      const datahub = new GraphQLClient(
         `https://${organization.organizationUrl}/datahub/v1/graphql`,
         { headers: { 'x-hasura-admin-secret': organization.adminSecret } }
      )

      const paidInvoice = await stripe.invoices.pay(invoiceId, {
         stripeAccount
      })
      console.log('paidInvoice', paidInvoice.id)
      await handleInvoice({ invoice: paidInvoice, datahub })

      const intent = await stripe.paymentIntents.retrieve(
         invoice.payment_intent,
         { stripeAccount }
      )
      console.log('intent', intent.id)
      await handlePaymentIntent({
         intent,
         datahub,
         stripeAccountId
      })
   } catch (error) {
      return res.status(500).json({ success: false, error })
   }
}

const handleInvoice = async ({ invoice, datahub }) => {
   try {
      let intent = null
      if (invoice.payment_intent) {
         intent = await stripe.paymentIntents.retrieve(invoice.payment_intent, {
            stripeAccount: invoice.metadata.stripeAccountId
         })
      }

      await client.request(UPDATE_CUSTOMER_PAYMENT_INTENT, {
         id: invoice.metadata.customerPaymentIntentId,
         _set: {
            stripeInvoiceId: invoice.id,
            stripeInvoiceDetails: invoice,
            ...(intent && {
               transactionRemark: intent,
               status: STATUS[intent.status],
               stripePaymentIntentId: intent.id
            })
         }
      })

      const dailycloak_history_objects = [
         {
            customerPaymentIntentId: invoice.metadata.customerPaymentIntentId,
            stripeInvoiceDetails: invoice,
            stripeInvoiceId: invoice.id,
            type: 'INVOICE',
            status: invoice.status
         }
      ]
      if (intent) {
         dailycloak_history_objects.push({
            status: intent.status,
            type: 'PAYMENT_INTENT',
            transactionRemark: intent,
            stripePaymentIntentId: intent.id,
            customerPaymentIntentId: invoice.metadata.customerPaymentIntentId
         })
      }

      await client.request(DAILYCLOAK_INSERT_STRIPE_PAYMENT_HISTORY, {
         objects: dailycloak_history_objects
      })

      if (invoice.metadata.type === 'cartPayment') {
         await datahub.request(UPDATE_CART_PAYMENT, {
            id: invoice.metadata.cartId,
            _set: {
               stripeInvoiceId: invoice.id,
               stripeInvoiceDetails: invoice,
               ...(intent && {
                  transactionId: intent.id,
                  transactionRemark: intent,
                  paymentStatus: STATUS[intent.status]
               })
            }
         })
      } else {
         await datahub.request(UPDATE_CART, {
            pk_columns: { id: invoice.metadata.cartId },
            _set: {
               stripeInvoiceId: invoice.id,
               stripeInvoiceDetails: invoice,
               ...(intent && {
                  transactionId: intent.id,
                  transactionRemark: intent,
                  paymentStatus: STATUS[intent.status]
               })
            }
         })
      }

      let datahub_history_objects = []

      if (invoice.metadata.type && invoice.metadata.type === 'cartPayment') {
         datahub_history_objects = [
            {
               cartPaymentId: invoice.metadata.cartId,
               stripeInvoiceDetails: invoice,
               stripeInvoiceId: invoice.id,
               type: 'INVOICE',
               status: invoice.status
            }
         ]
         if (intent) {
            datahub_history_objects.push({
               status: intent.status,
               type: 'PAYMENT_INTENT',
               transactionId: intent.id,
               transactionRemark: intent,
               cartPaymentId: invoice.metadata.cartId
            })
         }
      } else {
         datahub_history_objects = [
            {
               cartId: invoice.metadata.cartId,
               stripeInvoiceDetails: invoice,
               stripeInvoiceId: invoice.id,
               type: 'INVOICE',
               status: invoice.status
            }
         ]
         if (intent) {
            datahub_history_objects.push({
               status: intent.status,
               type: 'PAYMENT_INTENT',
               transactionId: intent.id,
               transactionRemark: intent,
               cartId: invoice.metadata.cartId
            })
         }
      }

      await datahub.request(DATAHUB_INSERT_STRIPE_PAYMENT_HISTORY, {
         objects: datahub_history_objects
      })
   } catch (error) {
      throw error
   }
}

const handlePaymentIntent = async ({ intent, datahub, stripeAccountId }) => {
   try {
      const invoice = await stripe.invoices.retrieve(intent.invoice, {
         stripeAccount: stripeAccountId
      })

      await client.request(UPDATE_CUSTOMER_PAYMENT_INTENT, {
         id: invoice.metadata.customerPaymentIntentId,
         _set: {
            stripeInvoiceId: invoice.id,
            stripeInvoiceDetails: invoice,
            transactionRemark: intent,
            status: STATUS[intent.status],
            stripePaymentIntentId: intent.id
         }
      })

      await client.request(DAILYCLOAK_INSERT_STRIPE_PAYMENT_HISTORY, {
         objects: [
            {
               customerPaymentIntentId:
                  invoice.metadata.customerPaymentIntentId,
               stripeInvoiceDetails: invoice,
               stripeInvoiceId: invoice.id,
               type: 'INVOICE',
               status: invoice.status
            },
            {
               status: intent.status,
               type: 'PAYMENT_INTENT',
               transactionRemark: intent,
               stripePaymentIntentId: intent.id,
               customerPaymentIntentId: invoice.metadata.customerPaymentIntentId
            }
         ]
      })
      if (invoice.metadata.type === 'cartPayment') {
         await datahub.request(UPDATE_CART_PAYMENT, {
            id: invoice.metadata.cartId,
            _set: {
               stripeInvoiceId: invoice.id,
               stripeInvoiceDetails: invoice,
               transactionId: intent.id,
               transactionRemark: intent,
               paymentStatus: STATUS[intent.status]
            }
         })
      } else {
         await datahub.request(UPDATE_CART, {
            pk_columns: { id: invoice.metadata.cartId },
            _set: {
               stripeInvoiceId: invoice.id,
               stripeInvoiceDetails: invoice,
               transactionId: intent.id,
               transactionRemark: intent,
               paymentStatus: STATUS[intent.status]
            }
         })
      }

      let datahub_history_objects = []

      if (invoice.metadata.type && invoice.metadata.type === 'cartPayment') {
         datahub_history_objects = [
            {
               cartPaymentId: invoice.metadata.cartId,
               stripeInvoiceDetails: invoice,
               stripeInvoiceId: invoice.id,
               type: 'INVOICE',
               status: invoice.status
            }
         ]
         if (intent) {
            datahub_history_objects.push({
               status: intent.status,
               type: 'PAYMENT_INTENT',
               transactionId: intent.id,
               transactionRemark: intent,
               cartPaymentId: invoice.metadata.cartId
            })
         }
      } else {
         datahub_history_objects = [
            {
               cartId: invoice.metadata.cartId,
               stripeInvoiceDetails: invoice,
               stripeInvoiceId: invoice.id,
               type: 'INVOICE',
               status: invoice.status
            }
         ]
         if (intent) {
            datahub_history_objects.push({
               status: intent.status,
               type: 'PAYMENT_INTENT',
               transactionId: intent.id,
               transactionRemark: intent,
               cartId: invoice.metadata.cartId
            })
         }
      }

      await datahub.request(DATAHUB_INSERT_STRIPE_PAYMENT_HISTORY, {
         objects: datahub_history_objects
      })
   } catch (error) {
      throw error
   }
}

export const update = async (req, res) => {
   try {
      const { id } = req.params
      const response = await stripe.paymentIntents.update(id, {
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

export const cancel = async (req, res) => {
   try {
      const { id } = req.params
      const response = await stripe.paymentIntents.cancel(id)

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
      const response = await stripe.paymentIntents.retrieve(id)

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
      const response = await stripe.paymentIntents.list(req.query)

      if (isObjectValid(response)) {
         return res.json({ success: true, data: response })
      } else {
         throw Error('Didnt get any response from Stripe!')
      }
   } catch (error) {
      return res.json({ success: false, error: error.message })
   }
}
