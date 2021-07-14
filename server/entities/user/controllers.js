import axios from 'axios'
import get_env from '../../../get_env'
import { client } from '../../lib/graphql'
import { UPDATE_USER } from './graphql/mutations'

export const manage = async (req, res) => {
   let requestType
   try {
      switch (req.body.event.op) {
         case 'INSERT':
            requestType = 'insertion'
            user.create(req.body.event.data.new, res)
            break
         case 'UPDATE':
            requestType = 'updation'
            user.create(req.body.event.data.new, res)
            break
         case 'DELETE':
            requestType = 'deletion'
            user.delete(req.body.event.data.old, res)
            break
         default:
            throw Error('No such operation')
      }
   } catch (error) {
      return res
         .status(400)
         .json({ success: false, message: `User ${requestType} failed` })
   }
}

const user = {
   create: async (user, res) => {
      try {
         if (!user.email) throw Error('Email is required!')
         if (!user.tempPassword) throw Error('Temporary password is required!')

         const KEYCLOAK_URL = await get_env('KEYCLOAK_URL')
         const KEYCLOAK_REALM = await get_env('KEYCLOAK_REALM')
         const KEYCLOAK_MANAGER = await get_env('KEYCLOAK_MANAGER')
         const KEYCLOAK_MANAGER_KEY = await get_env('KEYCLOAK_MANAGER_KEY')
         let response = await axios({
            url: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
            method: 'POST',
            headers: {
               'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
               username: KEYCLOAK_MANAGER,
               password: KEYCLOAK_MANAGER_KEY
            },
            data: 'grant_type=client_credentials'
         })
         const { access_token } = await response.data

         await axios({
            url: `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${access_token}`
            },
            data: {
               enabled: true,
               username: user.email,
               email: user.email,
               requiredActions: ['UPDATE_PASSWORD'],
               credentials: [
                  {
                     type: 'password',
                     value: user.tempPassword
                  }
               ]
            }
         })

         const { data } = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${user.email}`,
            {
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${access_token}`
               }
            }
         )

         if (data.length > 0) {
            await client.request(UPDATE_USER, {
               id: user.id,
               keycloakId: data[0].id
            })
         }
         return res
            .status(200)
            .json({ success: true, message: 'User created successfully!' })
      } catch (error) {
         return res.status(400).json({ success: false, error: error.message })
      }
   },
   delete: async (user, res) => {
      try {
         if (!user.keycloakId) throw Error('Keycloak ID is required!')

         const KEYCLOAK_URL = await get_env('KEYCLOAK_URL')
         const KEYCLOAK_REALM = await get_env('KEYCLOAK_REALM')
         await axios({
            method: 'DELETE',
            url: `${KEYCLOAK_URL}/admin/realm/${KEYCLOAK_REALM}/users/${user.keycloakId}`
         })
         return res
            .status(200)
            .json({ success: true, message: 'User deleted successfully!' })
      } catch (error) {
         return res.status(400).json({ success: false, error: error.message })
      }
   }
}
