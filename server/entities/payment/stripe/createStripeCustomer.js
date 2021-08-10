import { GraphQLClient } from 'graphql-request'

import stripe from '../../../lib/stripe'

const dailykey = new GraphQLClient(process.env.HASURA_KEYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.KEYCLOAK_ADMIN_SECRET
   }
})

const dailycloak = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': process.env.DAILYCLOAK_ADMIN_SECRET
   }
})

export const createStripeCustomer = async (req, res) => {
   try {
      const { clientId, keycloakId, organizationId } = req.body.event.data.new

      const { customer = {} } = await dailykey.request(CUSTOMER, { keycloakId })
      const { organization = {} } = await dailycloak.request(ORGANIZATION, {
         id: organizationId
      })

      if (organization.stripeAccountType === 'express') {
         return res.status(200).json({
            success: true,
            message: 'Skipped due to customer being of express parent account.'
         })
      }

      const response = await stripe.customers.create(
         {
            email: customer.email,
            name: `${customer.firstName || ''}${
               customer.lastName
                  ? (customer.firstName ? ' ' : '') + customer.lastName
                  : ''
            }`
         },
         {
            stripeAccount: organization.stripeAccountId
         }
      )

      await dailykey.request(UPDATE_CUSTOMER_BY_CLIENT, {
         pk_columns: { clientId, keycloakId },
         _set: { organizationStripeCustomerId: response.id }
      })

      return res.status(200).json({
         success: true,
         data: response,
         message: 'Successfully created the stripe customer'
      })
   } catch (error) {
      return res.status(500).json({ success: false, error })
   }
}

const CUSTOMER = `
   query customer($keycloakId: String!) {
      customer: platform_customer(keycloakId: $keycloakId) {
         email
         firstName
         lastName
      }
   }
`

const ORGANIZATION = `
   query organization($id: Int!) {
      organization(id: $id) {
         id
         stripeAccountId
         stripeAccountType
      }
   }
`

const UPDATE_CUSTOMER_BY_CLIENT = `
   mutation updateCustomerByClient(
      $pk_columns: platform_customerByClient_pk_columns_input!
      $_set: platform_customerByClient_set_input = {}
   ) {
      updateCustomerByClient: platform_updateCustomerByClient(
         pk_columns: $pk_columns
         _set: $_set
      ) {
         clientId
         keycloakId
      }
   }
`
