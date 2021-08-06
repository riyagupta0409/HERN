import axios from 'axios'
import { get, groupBy, isEmpty } from 'lodash'
import { createEvent } from 'ics'
import { writeFileSync } from 'fs'
import { client } from '../../lib/graphql'
const fetch = require('node-fetch')
const AWS = require('aws-sdk')
const nodemailer = require('nodemailer')

import {
   GET_SES_DOMAIN,
   UPDATE_CART,
   CART,
   CART_PAYMENT,
   CREATE_CART_PAYMENT,
   UPDATE_CART_PAYMENT
} from './graphql'
import path from 'path'
import get_env from '../../../get_env'

AWS.config.update({ region: 'us-east-2' })

export const handleCartPayment = async (req, res) => {
   try {
      const payload = req.body.event.data.new
      const { cart = {} } = await client.request(CART, { id: payload.id })
      console.log('cart', cart)
      if (cart.balancePayment > 0) {
         const { cartPayments = [] } = await client.request(CART_PAYMENT, {
            where: {
               cartId: {
                  _eq: cart.id
               },
               paymentStatus: {
                  _neq: 'SUCCEEDED'
               }
            }
         })
         console.log('CartPayments', cartPayments)

         if (cartPayments.length > 0) {
            if (
               cartPayments.length > 1 ||
               cartPayments[0].amount !== cart.balancePayment
            ) {
               //cancell all invalid previous cart...
               const cancelledCartPayments = await Promise.all(
                  cartPayments.map(async cartPayment => {
                     try {
                        const { updateCartPayment = {} } = await client.request(
                           UPDATE_CART_PAYMENT,
                           {
                              id: cartPayment.id,
                              _inc: {
                                 cancelAttempt: 1
                              }
                           }
                        )
                        return updateCartPayment
                     } catch (error) {
                        return {
                           success: false,
                           message: error.message
                        }
                     }
                  })
               )

               console.log({ cancelledCartPayments })

               const { createCartPayment = {} } = await client.request(
                  CREATE_CART_PAYMENT,
                  {
                     object: {
                        cartId: cart.id,
                        paymentRetryAttempt: 1,
                        amount: cart.balancePayment,
                        isTest: cart.isTest,
                        paymentMethodId: cart.paymentMethodId,
                        stripeCustomerId: cart.stripeCustomerId
                     }
                  }
               )
               res.status(200).json(createCartPayment)
            } else {
               const updatedCartPayment = await Promise.all(
                  cartPayments.map(async cartPayment => {
                     try {
                        const { updateCartPayment = {} } = await client.request(
                           UPDATE_CART_PAYMENT,
                           {
                              id: cartPayment.id,
                              _inc: {
                                 paymentRetryAttempt: 1
                              }
                           }
                        )
                        return updateCartPayment
                     } catch (error) {
                        return {
                           success: false,
                           message: error.message
                        }
                     }
                  })
               )
               console.log({ updatedCartPayment })
               res.status(200).json(updatedCartPayment)
            }
         } else {
            const { createCartPayment = {} } = await client.request(
               CREATE_CART_PAYMENT,
               {
                  object: {
                     cartId: cart.id,
                     paymentRetryAttempt: 1,
                     amount: cart.balancePayment,
                     isTest: cart.isTest,
                     paymentMethodId: cart.paymentMethodId,
                     stripeCustomerId: cart.stripeCustomerId
                  }
               }
            )
            console.log({ createCartPayment })
            res.status(200).json(createCartPayment)
         }
      }
   } catch (error) {
      console.log(error)
      res.status(400).json({
         success: false,
         message: error.message
      })
   }
}

export const initiatePayment = async (req, res) => {
   try {
      const payload = req.body.event.data.new
      const { cart = {} } = await client.request(CART, { id: payload.cartId })
      if (payload.id && payload.paymentStatus === 'SUCCEEDED') {
         return res.status(200).json({
            success: true,
            message:
               'Payment attempt cancelled since cart has already been paid!'
         })
      }

      if (cart.id && cart.paymentStatus === 'SUCCEEDED') {
         return res.status(200).json({
            success: true,
            message:
               'Payment attempt cancelled since cart has already been paid!'
         })
      }

      await client.request(UPDATE_CART, {
         id: payload.cartId,
         set: { amount: cart.amount + payload.amount }
      })

      if (payload.isTest || payload.amount === 0) {
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
         return res.status(200).json({
            success: true,
            message: 'Payment succeeded!'
         })
      }
      const ORGANIZATION_ID = await get_env('ORGANIZATION_ID')
      if (payload.amount > 0) {
         const body = {
            organizationId: ORGANIZATION_ID,
            statementDescriptor: payload.statementDescriptor || '',
            cart: {
               id: payload.id,
               amount: payload.amount,
               type: 'cartPayment'
            },
            customer: {
               paymentMethod: payload.paymentMethodId,
               stripeCustomerId: payload.stripeCustomerId
            }
         }
         const PAYMENTS_API = await get_env('PAYMENTS_API')
         await fetch(`${PAYMENTS_API}/api/initiate-payment`, {
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
      const { emailInput, inviteInput = {} } = req.body.input
      const inputDomain = emailInput.from.split('@')[1]
      let updatedAttachments = []

      console.log('InviteINput', inviteInput)

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

         //build the invite event
         if (Object.keys(inviteInput).length) {
            const event = {
               start: inviteInput.start,
               duration: inviteInput.duration,
               title: inviteInput.title,
               description: inviteInput.description,
               location: inviteInput.location,
               url: inviteInput.url,
               geo: inviteInput.geo,
               categories: inviteInput.categories,
               status: inviteInput.status,
               busyStatus: inviteInput.busyStatus,
               organizer: inviteInput.organizer,
               attendees: inviteInput.attendees
            }
            createEvent(event, async (error, value) => {
               if (error) {
                  console.log(error)
                  return
               }
               console.log('EVENT OUTPUT', value)
               await writeFileSync(
                  `${__dirname}/calendarInvite/${inviteInput.title.replace(
                     ' ',
                     '_'
                  )}.ics`,
                  value
               )
            })
            updatedAttachments.push({
               filename: `${inviteInput.title.replace(' ', '_')}.ics`,
               path: `${__dirname}/calendarInvite/${inviteInput.title.replace(
                  ' ',
                  '_'
               )}.ics`,
               contentType: 'text/calendar'
            })
         }

         emailInput.attachments.forEach(attachment => {
            updatedAttachments.push(attachment)
         })

         // build and send the message
         const message = {
            from: emailInput.from,
            to: emailInput.to,
            subject: emailInput.subject,
            html: emailInput.html,
            attachments: updatedAttachments
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
