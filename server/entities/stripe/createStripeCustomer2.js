import { GraphQLClient } from 'graphql-request'

import stripe from '../../lib/stripe'

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

export const createStripeCustomer2 = async (req, res) => {
   try {
      const { keycloakId } = req.body.event.data.new

      const { organization = {} } = await dailycloak.request(ORGANIZATION, {
         id: req.headers.organizationid
      })

      const { datahubUrl = '', adminSecret = '' } = organization

      const datahub = new GraphQLClient(datahubUrl, {
         headers: { 'x-hasura-admin-secret': adminSecret }
      })

      const { customer = {} } = await datahub.request(CUSTOMER, { keycloakId })

      const headers = {}

      if (
         organization.stripeAccountType === 'standard' &&
         organization.stripeAccountId
      ) {
         headers.stripeAccount = organization.stripeAccountId
      }

      const name = `${customer.firstName || ''} ${
         customer.lastName || ''
      }`.trim()

      const response = await stripe.customers.create(
         { name, email: customer.email },
         headers
      )

      await datahub.request(UPDATE_PLATFORM_CUSTOMER, {
         keycloakId,
         _set: { stripeCustomerId: response.id }
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
      customer: platform_customer__by_pk(keycloakId: $keycloakId) {
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
         datahubUrl
         adminSecret
         stripeAccountId
         stripeAccountType
      }
   }
`

const UPDATE_PLATFORM_CUSTOMER = `
   mutation update_platform_customer(
      $keycloakId: String!
      $_set: platform_customer__set_input = {}
   ) {
      update_platform_customer: update_platform_customer__by_pk(
         pk_columns: { keycloakId: $keycloakId }
         _set: $_set
      ) {
         id: keycloakId
      }
   }
`
