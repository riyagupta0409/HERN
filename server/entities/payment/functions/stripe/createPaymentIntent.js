import handleInvoice from './handleInvoice'
import handlePaymentIntent from './handlePaymentIntent'
import stripe from '../../../../lib/stripe'
import { client } from '../../../../lib/graphql'
import { logger } from '../../../../utils'
import get_env from '../../../../../get_env'
import {
   ORGANIZATIONS,
   UPDATE_CART_PAYMENT,
   DATAHUB_INSERT_STRIPE_PAYMENT_HISTORY
} from '../../graphql'

const STATUS = {
   requires_payment_method: 'REQUIRES_PAYMENT_METHOD',
   requires_action: 'REQUIRES_ACTION',
   processing: 'PROCESSING',
   canceled: 'CANCELLED',
   succeeded: 'SUCCEEDED'
}

export const createPaymentIntent = async arg => {
   try {
      console.log('createPaymentIntent', arg)
      const {
         id: transferGroup,
         statementDescriptor,
         stripeInvoiceId,
         paymentMethodId: paymentMethod,
         stripeCustomerId,
         requires3dSecure,
         amount,
         oldAmount
      } = arg
      const { organizations = [] } = await client.request(ORGANIZATIONS)
      const [organization] = organizations

      console.log(organization)
      if (organization.stripeAccountId) {
         const chargeAmount = (amount * 100).toFixed(0)
         // const fixedDeduction = organization.chargeFixed * 100
         // const percentDeduction =
         // chargeAmount * (organization.chargePercentage / 100)
         const CURRENCY = await get_env('CURRENCY')
         const organizationId = organization.id

         // const transferAmount = (
         //    chargeAmount -
         //    fixedDeduction -
         //    percentDeduction
         // ).toFixed(0)

         console.log(chargeAmount, organizationId, CURRENCY)

         const _stripe = await stripe()
         console.log('after stripe init')
         if (organization.stripeAccountType === 'standard') {
            console.log('inside if statement for standard account')
            // RE ATTEMPT
            let previousInvoice = null
            if (stripeInvoiceId) {
               console.log('inside if statement for prev stripe invoice id')
               previousInvoice = await _stripe.invoices.retrieve(
                  stripeInvoiceId,
                  {
                     stripeAccount: organization.stripeAccountId
                  }
               )
               console.log({ previousInvoice })
               const isValidForReattempt = [
                  previousInvoice,
                  previousInvoice && previousInvoice.status !== 'void',
                  amount === oldAmount
               ].every(node => node)

               if (!requires3dSecure && isValidForReattempt) {
                  console.log('inside if statement for paying previous invoice')
                  const invoice = await _stripe.invoices.pay(
                     stripeInvoiceId,
                     { payment_method: paymentMethod },
                     { stripeAccount: organization.stripeAccountId }
                  )
                  console.log('invoice', invoice.id)
                  await handleInvoice({ invoice })

                  if (invoice.payment_intent) {
                     const intent = await _stripe.paymentIntents.retrieve(
                        invoice.payment_intent,
                        { stripeAccount: organization.stripeAccountId }
                     )
                     console.log('intent', intent.id)
                     await handlePaymentIntent({
                        intent,
                        stripeAccountId: organization.stripeAccountId
                     })
                  }
                  return {
                     success: true,
                     data: invoice,
                     message: 'Payment has been reattempted'
                  }
               }
            }

            if (previousInvoice && stripeInvoiceId) {
               console.log('inside if statement for voiding previous invoice')
               await _stripe.invoices.voidInvoice(stripeInvoiceId, {
                  stripeAccount: organization.stripeAccountId
               })
            }
            // CREATE NEW INVOICE
            console.log('before creating new invoice item')
            const item = await _stripe.invoiceItems.create(
               {
                  amount: chargeAmount,
                  currency: CURRENCY.toLowerCase(),
                  customer: stripeCustomerId,
                  description: 'Weekly Subscription'
               },
               { stripeAccount: organization.stripeAccountId }
            )
            console.log('after creating new invoice item')
            console.log('item', item.id)

            if (requires3dSecure) {
               console.log('REQUIRES 3D SECURE')
            }
            console.log('before creating new invoice')
            const invoice = await _stripe.invoices.create(
               {
                  customer: stripeCustomerId,
                  default_payment_method: paymentMethod,
                  statement_descriptor:
                     statementDescriptor || organization.organizationName,
                  // days_until_due: 1,
                  // collection_method: 'send_invoice',
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
                     cartPaymentId: transferGroup,
                     // customerPaymentIntentId: id,
                     stripeAccountId: organization.stripeAccountId
                  }
               },
               { stripeAccount: organization.stripeAccountId }
            )
            console.log('after creating new invoice')
            console.log('invoice', invoice.id)
            console.log('before handle invoice')
            await handleInvoice({ invoice })
            console.log('after handle invoice')

            console.log('before finalizing invoice')
            const finalizedInvoice = await _stripe.invoices.finalizeInvoice(
               invoice.id,
               { stripeAccount: organization.stripeAccountId }
            )
            console.log('finalizedInvoice', finalizedInvoice.id)
            await handleInvoice({ invoice: finalizedInvoice })

            console.log('before invoice pay')
            const result = await _stripe.invoices.pay(finalizedInvoice.id, {
               stripeAccount: organization.stripeAccountId
            })
            console.log('result', result.id)

            console.log('before handleInvoice but just after the invoice pay')
            await handleInvoice({ invoice: result })
            console.log('after handleInvoice but just after the invoice pay')
            if (result.payment_intent) {
               const paymentIntent = await _stripe.paymentIntents.retrieve(
                  result.payment_intent,
                  { stripeAccount: organization.stripeAccountId }
               )
               console.log('paymentIntent', paymentIntent.id)
               await handlePaymentIntent({
                  intent: paymentIntent,
                  stripeAccountId: organization.stripeAccountId
               })
            }
            return {
               data: result,
               success: true,
               message: 'New invoice payment has been made'
            }
         }
         if (organization.stripeAccountType === 'express') {
            const intent = await _stripe.paymentIntents.create({
               amount: chargeAmount,
               currency: CURRENCY.toLowerCase(),
               confirm: true,
               on_behalf_of: organization.stripeAccountId,
               customer: stripeCustomerId,
               payment_method: paymentMethod,
               transfer_group: transferGroup,
               statement_descriptor:
                  statementDescriptor || organization.organizationName,
               return_url: `https://${organization.organizationUrl}/store/paymentProcessing`
            })
            if (intent && intent.id) {
               await client.request(UPDATE_CART_PAYMENT, {
                  pk_columns: { id: transferGroup },
                  _set: {
                     transactionId: intent.id,
                     transactionRemark: intent,
                     paymentStatus: STATUS[intent.status]
                  }
               })

               await client.request(DATAHUB_INSERT_STRIPE_PAYMENT_HISTORY, {
                  objects: [
                     {
                        cartId: transferGroup,
                        status: intent.status,
                        type: 'PAYMENT_INTENT',
                        transactionId: intent.id,
                        transactionRemark: intent
                     }
                  ]
               })

               return {
                  success: true,
                  data: intent
               }
            }
            if (!intent) {
               return {
                  success: false,
                  message: 'Error creating payment intent'
               }
            }
         }
      }
   } catch (error) {
      logger('/api/payment-intent', error)
      return res.status(500).json({ success: false, error })
   }
}
