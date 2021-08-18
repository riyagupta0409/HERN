export const ORGANIZATIONS = `
query organizations {
   organizations {
      id
      organizationUrl
      stripeAccountId
      organizationName
      stripeAccountType
   }
}
`
export const CART_PAYMENT = `
query CART_PAYMENT($id: Int!) {
   cartPayment(id: $id) {
   id
   cartId
   paymentStatus
   paymentId
   stripeInvoiceId
   paymentRetryAttempt
 }
}
`
