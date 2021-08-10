import { GraphQLClient, request } from 'graphql-request'

import stripe from '../../../lib/stripe'
import { isObjectValid, logger } from '../../../utils'

const dailycloak_client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': `${process.env.DAILYCLOAK_ADMIN_SECRET}`
   }
})

const UPDATE_ORG = `
   mutation updateOrganization(
      $id: Int!
      $_set: organization_organization_set_input!
   ) {
      updateOrganization(pk_columns: { id: $id }, _set: $_set) {
         id
      }
   }
`

export const getAccountId = async (req, res) => {
   try {
      const { org_id, code } = req.query
      const { stripe_user_id } = await stripe.oauth.token({
         code,
         grant_type: 'authorization_code'
      })

      await dailycloak_client.request(UPDATE_ORG, {
         id: org_id,
         _set: {
            stripeAccountId: stripe_user_id
         }
      })

      return res.json({
         success: true,
         data: { stripeAccountId: stripe_user_id }
      })
   } catch (error) {
      logger('/api/account-id', error.message)
      return res.json({ success: false, error: error.message })
   }
}

export const createLoginLink = async (req, res) => {
   try {
      const { accountId } = req.query
      const response = await stripe.accounts.createLoginLink(accountId)
      return res.json({
         success: true,
         data: { link: response }
      })
   } catch (error) {
      logger('/api/login-link', error.message)
      return res.json({ success: false, error: error.message })
   }
}

export const getBalance = async (req, res) => {
   try {
      const { accountId } = req.query
      const response = await stripe.balance.retrieve(null, {
         stripeAccount: accountId
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

const CREATE_CUSTOMER_BY_CLIENT = `
   mutation platform_createCustomerByClient($clientId: String!, $organizationId: Int!, $keycloakId: String!) {
      platform_createCustomerByClient(object: {clientId: $clientId, organizationId: $organizationId, keycloakId: $keycloakId}) {
         clientId
         keycloakId
         organizationId
      }
   }
`
const client = new GraphQLClient(process.env.HASURA_KEYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': `${process.env.KEYCLOAK_ADMIN_SECRET}`
   }
})

export const createCustomerByClient = async (req, res) => {
   try {
      const { clientId, keycloakId } = req.body.event.data.new

      // create customer by client
      await client.request(CREATE_CUSTOMER_BY_CLIENT, {
         clientId,
         keycloakId,
         organizationId: Number(req.headers.organizationid)
      })
      return res
         .status(200)
         .json({ success: true, message: 'Successfully created!' })
   } catch (error) {
      logger('/api/webhooks/customer-by-client', error.message)
      return res.status(400).json({ success: false, error: error.message })
   }
}

export const authorizeRequest = async (req, res) => {
   try {
      const organizationId = req.body.headers['Organization-Id']
      const keycloakId = req.body.headers['Keycloak-Id']

      return res.status(200).json({
         'X-Hasura-Role': keycloakId ? 'consumer' : 'limited',
         'X-Hasura-User-Id': organizationId,
         'X-Hasura-Keycloak-Id': keycloakId
      })
   } catch (error) {
      logger('/api/webhooks/authorize-request', error.message)
      return res.status(404).json({ success: false, error: error.message })
   }
}

const UPSERT_CUSTOMER = `
   mutation platform_createCustomer($email: String, $keycloakId: String!, $stripeCustomerId: String) {
      platform_createCustomer(
         object: { email: $email, keycloakId: $keycloakId, stripeCustomerId: $stripeCustomerId },
         on_conflict: {
            constraint: customer_keycloakId_key, update_columns: [email, stripeCustomerId]
         }
      ) {
         keycloakId
      }
   }
`

export const createCustomer = async (req, res) => {
   try {
      const { email, id, realm_id } = req.body.event.data.new

      if (realm_id === 'consumers') {
         if (!email) {
            let data = await client.request(UPSERT_CUSTOMER, {
               keycloakId: id
            })
            return res.status(200).json({ success: true, data })
         }

         const customer = await stripe.customers.create({ email })
         const data = await client.request(UPSERT_CUSTOMER, {
            email,
            keycloakId: id,
            stripeCustomerId: customer.id
         })

         return res.status(200).json({ success: true, data })
      }
      return res
         .status(403)
         .json({ success: false, message: 'Must be consumers realm!' })
   } catch (error) {
      logger('/api/webhooks/customer', error.message)
      return res.status(404).json({ success: false, error: error.message })
   }
}
