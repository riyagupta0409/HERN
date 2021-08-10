export const PAYMENT_PARTNERSHIP = `
   query partnership($id: Int!) {
      partnership: paymentHub_paymentPartnership_by_pk(id: $id) {
         id
         isActive
         pricing
         currency
         publishableConfig
         secretConfig
         isPayoutRequired
         organization {
            id
            datahubUrl
            adminSecret
         }
         callbackUrl: metaInfo(path:"callbackUrl")
         company: paymentCompany {
            id
            name
            type
            identifier
         }
      }
   }
`

export const INSERT_PAYMENT_RECORD = `
   mutation insertPaymentRecord($object: paymentHub_payment_insert_input!) {
      insertPaymentRecord: insert_paymentHub_payment_one(object: $object) {
         id
      }
   }
`

export const UPDATE_PAYMENT_RECORD = `
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

export const UPDATE_CART = `
   mutation updateCart($id: Int!, $_set: order_cart_set_input!) {
      updateCart(pk_columns: { id: $id }, _set: $_set) {
         id
      }
   }
`

export const PAYMENT = `
   query payment($id: uuid!) {
      payment: paymentHub_payment_by_pk(id: $id) {
         id
         orderCartId
         paymentRequestId
         partnership: paymentPartnership {
            id
            secretId: secretConfig(path: "id")
            clientId: publishableConfig(path: "id")
            organization {
               datahubUrl
               adminSecret
            }
            company: paymentCompany {
               type
               identifier
            }
         }
      }
   }
`

export const CUSTOMER = `
   query customer($keycloakId: String!) {
      customer: platform_customer(keycloakId: $keycloakId) {
         email
         fullName
         phoneNumber
      }
   }
`

export const CART = `
   query cart($id: Int!) {
      cart(id: $id) {
         id
         paymentStatus
      }
   }
`
