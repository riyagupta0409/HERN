import fs from 'fs'
import axios from 'axios'
import { get, groupBy, isEmpty } from 'lodash'
import { client } from '../../lib/graphql'
import { GraphQLClient } from 'graphql-request'
const fetch = require('node-fetch')
const AWS = require('aws-sdk')
const nodemailer = require('nodemailer')

import { GET_SES_DOMAIN, UPDATE_CART } from './graphql'
import path from 'path'
import get_env from '../../../get_env'
import stripe from '../../lib/stripe'
import { isObjectValid, logger } from '../../utils'

AWS.config.update({ region: 'us-east-2' })

const dailycloak_client = new GraphQLClient(process.env.DAILYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': `${process.env.DAILYCLOAK_ADMIN_SECRET}`
   }
})

const CART = `
   query cart($id: Int!) {
      cart(id: $id) {
         id
         isTest
         amount
         totalPrice
         paymentStatus
         paymentMethodId
         stripeCustomerId
         statementDescriptor
      }
   }
`

export const initiatePayment = async (req, res) => {
   try {
      const payload = req.body.event.data.new

      const { cart = {} } = await client.request(CART, { id: payload.id })

      if (cart.id && cart.paymentStatus === 'SUCCEEDED') {
         return res.status(200).json({
            success: true,
            message:
               'Payment attempt cancelled since cart has already been paid!'
         })
      }

      await client.request(UPDATE_CART, {
         id: cart.id,
         set: { amount: cart.totalPrice }
      })

      if (cart.isTest || cart.totalPrice === 0) {
         await client.request(UPDATE_CART, {
            id: cart.id,
            set: {
               paymentStatus: 'SUCCEEDED',
               isTest: true,
               transactionId: 'NA',
               transactionRemark: {
                  id: 'NA',
                  amount: cart.totalPrice * 100,
                  message: 'payment bypassed',
                  reason: cart.isTest ? 'test mode' : 'amount 0 - free'
               }
            }
         })
         return res.status(200).json({
            success: true,
            message: 'Payment succeeded!'
         })
      }
      const ORGANIZATION_ID = await get_env('ORGANIZATION_ID')
      if (cart.totalPrice > 0) {
         const body = {
            organizationId: ORGANIZATION_ID,
            statementDescriptor: cart.statementDescriptor || '',
            cart: {
               id: cart.id,
               amount: cart.totalPrice
            },
            customer: {
               paymentMethod: cart.paymentMethodId,
               stripeCustomerId: cart.stripeCustomerId
            }
         }
         const PAYMENTS_API = await get_env('PAYMENTS_API')
         await fetch(`${PAYMENTS_API}/api/initiate-stripe-payment`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
         })
      }

      res.status(200).json({
         success: true,
         message: 'Payment initiated!'
      })
   } catch (error) {
      console.log(error)
      res.status(400).json({
         success: false,
         message: error.message
      })
   }
}

export const sendMail = async (req, res) => {
   try {
      const { emailInput } = req.body.input
      const inputDomain = emailInput.from.split('@')[1]

      // Get the DKIM details from dailycloak
      const dkimDetails = await client.request(GET_SES_DOMAIN, {
         domain: inputDomain
      })

      if (dkimDetails.aws_ses.length === 0) {
         return res.status(400).json({
            success: false,
            message: `Domain ${inputDomain} is not registered. Cannot send emails.`
         })
      } else {
         // create nodemailer transport
         const transport = nodemailer.createTransport({
            SES: new AWS.SES({ apiVersion: '2010-12-01' }),
            dkim: {
               domainName: dkimDetails.aws_ses[0].domain,
               keySelector: dkimDetails.aws_ses[0].keySelector,
               privateKey: dkimDetails.aws_ses[0].privateKey.toString('binary')
            }
         })
         // build and send the message
         const message = {
            from: emailInput.from,
            to: emailInput.to,
            subject: emailInput.subject,
            html: emailInput.html,
            attachments: emailInput.attachments
         }

         if (dkimDetails.aws_ses[0].isVerified === true) {
            await transportEmail(transport, message)
         } else {
            throw new Error(
               `Domain - ${inputDomain} - is not verified. Cannot send emails.`
            )
         }

         return res.status(200).json({
            success: true,
            message: 'Email sent successfully!'
         })
      }
   } catch (error) {
      console.log(error)
      return res.status(400).json({
         success: false,
         message: error.message
      })
   }
}

const transportEmail = async (transporter, message) => {
   return new Promise((resolve, reject) => {
      transporter.sendMail(message, (err, info) => {
         if (err) {
            reject(err)
         } else {
            resolve(info)
         }
      })
   })
}

export const placeAutoComplete = async (req, res) => {
   try {
      const { key, input, location, components, language, types } = req.query
      if (key && input) {
         const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${key}&language=${language}&components=${components}&location=${location}`
         const response = await axios.get(url)
         return res.json(response.data)
      } else {
         throw Error('No key or input provided!')
      }
   } catch (err) {
      return res.status(400).json({
         success: false,
         message: err.message
      })
   }
}

export const placeDetails = async (req, res) => {
   try {
      const { key, placeid, language } = req.query
      if (key && placeid) {
         const url = `https://maps.googleapis.com/maps/api/place/details/json?key=${key}&placeid=${placeid}&language=${language}`
         const response = await axios.get(url)
         return res.json(response.data)
      } else {
         throw Error('No key or place id provided!')
      }
   } catch (err) {
      return res.status(400).json({
         success: false,
         message: err.message
      })
   }
}

export const getDistance = async (req, res) => {
   try {
      const { key, lat1, lon1, lat2, lon2 } = req.body
      if (key && lat1 && lon1 && lat2 && lon2) {
         const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${key}`
         const response = await axios.get(url)
         return res.json(response.data)
      } else {
         throw Error('No key or coordinates provided!')
      }
   } catch (err) {
      return res.status(400).json({
         success: false,
         message: err.message
      })
   }
}

const STAFF_USERS = `
   query users($email: String_comparison_exp!) {
      users: settings_user(where: { email: $email }) {
         id
         email
         keycloakId
      }
   }
`

const UPDATE_STAFF_USER = `
   mutation updateUser(
      $where: settings_user_bool_exp!
      $_set: settings_user_set_input!
   ) {
      updateUser: update_settings_user(where: $where, _set: $_set) {
         affected_rows
      }
   }
`

export const authorizeRequest = async (req, res) => {
   try {
      const staffId = req.body.headers['Staff-Id']
      const staffEmail = req.body.headers['Staff-Email']

      const keycloakId = req.body.headers['Keycloak-Id']
      const cartId = req.body.headers['Cart-Id']
      const brandId = req.body.headers['Brand-Id']
      const brandCustomerId = req.body.headers['Brand-Customer-Id']
      const source = req.body.headers['Source']

      let staffUserExists = false
      if (staffId) {
         const { users = [] } = await client.request(STAFF_USERS, {
            email: { _eq: staffEmail }
         })
         if (users.length > 0) {
            staffUserExists = true
            const [user] = users
            if (user.keycloakId !== staffId) {
               await client.request(UPDATE_STAFF_USER, {
                  where: { email: { _eq: staffEmail } },
                  _set: { keycloakId: staffId }
               })
            }
         }
      }

      return res.status(200).json({
         'X-Hasura-Role': keycloakId ? 'consumer' : 'guest-consumer',
         'X-Hasura-Source': source,
         'X-Hasura-Brand-Id': brandId,
         ...(keycloakId && {
            'X-Hasura-Keycloak-Id': keycloakId
         }),
         ...(cartId && { 'X-Hasura-Cart-Id': cartId }),
         ...(brandCustomerId && {
            'X-Hasura-Brand-Customer-Id': brandCustomerId
         }),
         ...(staffId &&
            staffUserExists && {
               'X-Hasura-Role': 'admin',
               'X-Hasura-Staff-Id': staffId,
               'X-Hasura-Email-Id': staffEmail
            })
      })
   } catch (error) {
      return res.status(404).json({ success: false, error: error.message })
   }
}

const ENVS = `
   query envs {
      envs: settings_env {
         id
         title
         value
         belongsTo
      }
   }
`

/*
used to create env config files and populate with relevant envs
*/
export const populate_env = async (req, res) => {
   try {
      const { envs } = await client.request(ENVS)
      if (isEmpty(envs)) {
         throw Error('No envs found!')
      } else {
         const grouped = groupBy(envs, 'belongsTo')

         const server = {}

         get(grouped, 'server', {}).forEach(node => {
            server[node.title] = node.value
         })

         fs.writeFileSync(
            path.join(__dirname, '../../../', 'config.js'),
            'module.exports = ' + JSON.stringify(server, null, 2)
         )

         const store = {}

         get(grouped, 'store', {}).forEach(node => {
            store[node.title] = node.value
         })

         const PATH_TO_SUBS = path.join(
            __dirname,
            '../../../',
            'store',
            'public',
            'env-config.js'
         )

         fs.writeFileSync(
            PATH_TO_SUBS,
            'window._env_ = ' + JSON.stringify(store, null, 2)
         )

         const admin = {}

         get(grouped, 'admin', []).forEach(node => {
            admin[node.title] = node.value
         })

         if (process.env.NODE_ENV === 'development') {
            const PATH_TO_ADMIN = path.join(
               __dirname,
               '../../../',
               'admin',
               'public',
               'env-config.js'
            )
            fs.writeFileSync(
               PATH_TO_ADMIN,
               'window._env_ = ' + JSON.stringify(admin, null, 2)
            )
         } else {
            const PATH_TO_ADMIN = path.join(
               __dirname,
               '../../../',
               'admin',
               'build',
               'env-config.js'
            )
            fs.writeFileSync(
               PATH_TO_ADMIN,
               'window._env_ = ' + JSON.stringify(admin, null, 2)
            )
         }

         return res.status(200).json({
            success: true,
            data: { server, store, admin }
         })
      }
   } catch (error) {
      return res.status(404).json({ success: false, error: error.message })
   }
}

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
const dailykey_client = new GraphQLClient(process.env.HASURA_KEYCLOAK_URL, {
   headers: {
      'x-hasura-admin-secret': `${process.env.KEYCLOAK_ADMIN_SECRET}`
   }
})

export const createCustomerByClient = async (req, res) => {
   try {
      const { clientId, keycloakId } = req.body.event.data.new

      // create customer by client
      await dailykey_client.request(CREATE_CUSTOMER_BY_CLIENT, {
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
            let data = await dailykey_client.request(UPSERT_CUSTOMER, {
               keycloakId: id
            })
            return res.status(200).json({ success: true, data })
         }

         const customer = await stripe.customers.create({ email })
         const data = await dailykey_client.request(UPSERT_CUSTOMER, {
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
