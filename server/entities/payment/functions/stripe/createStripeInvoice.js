import handleInvoice from './handleInvoice'
import handlePaymentIntent from './handlePaymentIntent'
import stripe from '../../../../lib/stripe'
import { logger, isConnectedIntegration } from '../../../../utils'
import get_env from '../../../../../get_env'

export const createStripeInvoice = async arg => {
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
      const organizationId = await get_env('ORGANIZATION_ID')
      const stripeAccountId = await get_env('STRIPE_ACCOUNT_ID')
      const stripeAccountType = await get_env('STRIPE_ACCOUNT_TYPE')
      const organizationName = await get_env('ORGANIZATION_NAME')

      if (stripeAccountId) {
         const chargeAmount = (amount * 100).toFixed(0)
         // const fixedDeduction = organization.chargeFixed * 100
         // const percentDeduction =
         // chargeAmount * (organization.chargePercentage / 100)
         const CURRENCY = await get_env('CURRENCY')

         // const transferAmount = (
         //    chargeAmount -
         //    fixedDeduction -
         //    percentDeduction
         // ).toFixed(0)

         console.log(chargeAmount, organizationId, CURRENCY)

         const _stripe = await stripe()
         console.log('after stripe init')
         if (stripeAccountType === 'standard') {
            console.log('inside if statement for standard account')
            // RE ATTEMPT
            let previousInvoice = null
            if (stripeInvoiceId) {
               console.log('inside if statement for prev stripe invoice id')
               previousInvoice = await _stripe.invoices.retrieve(
                  // stripeParams(stripeInvoiceId)
                  stripeInvoiceId,
                  (await isConnectedIntegration())
                     ? {
                          stripeAccount: stripeAccountId
                       }
                     : null
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
                     (await isConnectedIntegration())
                        ? {
                             stripeAccount: stripeAccountId
                          }
                        : null
                  )
                  console.log('invoice', invoice.id)
                  await handleInvoice({ invoice })

                  if (invoice.payment_intent) {
                     const intent = await _stripe.paymentIntents.retrieve(
                        invoice.payment_intent,
                        (await isConnectedIntegration())
                           ? {
                                stripeAccount: stripeAccountId
                             }
                           : null
                     )
                     console.log('intent', intent.id)
                     await handlePaymentIntent({
                        intent,
                        stripeAccountId
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
               await _stripe.invoices.voidInvoice(
                  stripeInvoiceId,
                  (await isConnectedIntegration())
                     ? {
                          stripeAccount: stripeAccountId
                       }
                     : null
               )
            }
            // CREATE NEW INVOICE
            console.log('before creating new invoice item')
            console.log(
               'integration',
               {
                  amount: chargeAmount,
                  currency: CURRENCY.toLowerCase(),
                  customer: stripeCustomerId,
                  description: 'Weekly Subscription'
               },
               (await isConnectedIntegration())
                  ? {
                       stripeAccount: stripeAccountId
                    }
                  : null
            )
            const item = await _stripe.invoiceItems.create(
               {
                  amount: chargeAmount,
                  currency: CURRENCY.toLowerCase(),
                  customer: stripeCustomerId,
                  description: 'Weekly Subscription'
               },

               (await isConnectedIntegration())
                  ? {
                       stripeAccount: stripeAccountId
                    }
                  : null
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
                  statement_descriptor: statementDescriptor || organizationName,
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
                     stripeAccountId
                  }
               },
               (await isConnectedIntegration())
                  ? {
                       stripeAccount: stripeAccountId
                    }
                  : null
            )
            console.log('after creating new invoice')
            console.log('invoice', invoice.id)
            console.log('before handle invoice')
            await handleInvoice({ invoice })
            console.log('after handle invoice')

            console.log('before finalizing invoice')
            const finalizedInvoice = await _stripe.invoices.finalizeInvoice(
               invoice.id,
               (await isConnectedIntegration())
                  ? {
                       stripeAccount: stripeAccountId
                    }
                  : null
            )
            console.log('finalizedInvoice', finalizedInvoice.id)
            await handleInvoice({ invoice: finalizedInvoice })

            console.log('before invoice pay')
            const result = await _stripe.invoices.pay(
               finalizedInvoice.id,
               (await isConnectedIntegration())
                  ? {
                       stripeAccount: stripeAccountId
                    }
                  : null
            )
            console.log('result', result.id)

            console.log('before handleInvoice but just after the invoice pay')
            await handleInvoice({ invoice: result })
            console.log('after handleInvoice but just after the invoice pay')
            if (result.payment_intent) {
               const paymentIntent = await _stripe.paymentIntents.retrieve(
                  result.payment_intent,
                  (await isConnectedIntegration())
                     ? {
                          stripeAccount: stripeAccountId
                       }
                     : null
               )
               console.log('paymentIntent', paymentIntent.id)
               await handlePaymentIntent({
                  intent: paymentIntent,
                  stripeAccountId
               })
            }
            return {
               data: result,
               success: true,
               message: 'New invoice payment has been made'
            }
         }
      }
   } catch (error) {
      logger('/api/payment-intent', error)
      throw error
   }
}
