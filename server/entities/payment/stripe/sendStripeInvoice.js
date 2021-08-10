import { GraphQLClient } from 'graphql-request'

import { logger } from '../../../utils'
import stripe from '../../../lib/stripe'

const client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET
   }
})

const ORGANIZATION = `
   query organization($id: Int!) {
      organization(id: $id) {
         id
         adminSecret
         organizationUrl
         stripeAccountId
         stripeAccountType
      }
   }
`

export const sendStripeInvoice = async (req, res) => {
   try {
      const organizationId = req.headers['organization-id']

      const { organization } = await client.request(ORGANIZATION, {
         id: Number(organizationId)
      })

      if (!organization) throw Error('No such organization exists!')

      const { id } = req.body.input

      if (organization.stripeAccountType === 'standard') {
         await stripe.invoices.sendInvoice(id, {
            stripeAccount: organization.stripeAccountId
         })
      } else {
         await stripe.invoices.sendInvoice(id, {
            stripeAccount: organization.stripeAccountId
         })
      }

      return res.status(200).json({
         success: true,
         message: 'Successfully to sent invoice!'
      })
   } catch (error) {
      logger('/api/webhooks/stripe/send-invoice', error)
      return res.status(400).json({
         success: false,
         message: error.message || 'Failed to send invoice!'
      })
   }
}
