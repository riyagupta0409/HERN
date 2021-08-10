import get from 'lodash.get'
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET,
   },
})

export const handleRazorpayEvents = async (req, res) => {
   try {
      const event = get(req.body, 'event')
      let variables = {
         paymentStatus: '',
         paymentRequestId: '',
         paymentTransactionId: '',
         paymentTransactionInfo: req.body || {},
      }
      const paymentId = get(
         req.body,
         'payload.payment_link.entity.notes.paymentId'
      )

      if (paymentId) {
         const { payment } = await client.request(PAYMENT_RECORD, {
            id: paymentId,
         })
         const isAutoCancelled = get(payment, 'isAutoCancelled')
         if (isAutoCancelled) {
            return res.status(200).json({
               success: true,
               error: 'Aborting since payment was auto cancelled on different payment method attempt!',
            })
         }
      }

      if (event) {
         if (event === 'payment_link.paid') {
            variables.paymentStatus = 'SUCCEEDED'
            variables.paymentRequestId =
               get(req.body, 'payload.order.entity.id') || null
            variables.paymentTransactionId =
               get(req.body, 'payload.payment.entity.id') || null
         } else if (event === 'payment_link.cancelled') {
            variables.paymentStatus = 'CANCELLED'
         } else if (event === 'payment_link.expired') {
            variables.paymentStatus = 'EXPIRED'
         } else {
            return res.status(401).json({
               success: false,
               error: 'Unmapped webhook event!',
            })
         }

         if (paymentId) {
            const { updatePaymentTransaction } = await client.request(
               UPDATE_PAYMENT_RECORD,
               {
                  _set: variables,
                  pk_columns: { id: paymentId },
               }
            )
            return res.status(200).json({
               success: true,
               data: updatePaymentTransaction,
               message: 'Successfully updated payment transaction.',
            })
         }
         return res.status(500).json({
            success: false,
            error: 'Failed to update payment transaction.',
         })
      } else {
         return res
            .status(401)
            .json({ success: false, error: 'Unmapped webhook event!' })
      }
   } catch (error) {
      return res.status(500).json({ success: false, error })
   }
}

const UPDATE_PAYMENT_RECORD = `
   mutation updatePaymentTransaction(
      $pk_columns: paymentHub_payment_pk_columns_input!
      $_set: paymentHub_payment_set_input!
   ) {
      updatePaymentTransaction: update_paymentHub_payment_by_pk(
         pk_columns: $pk_columns
         _set: $_set
      ) {
         id
      }
   }
`

const PAYMENT_RECORD = `
   query payment($id: uuid!) {
      payment: paymentHub_payment_by_pk(id: $id) {
         id
         isAutoCancelled
      }
   }
`
