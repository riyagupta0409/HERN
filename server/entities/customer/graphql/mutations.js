export const UPDATE_CONSUMER = `
   mutation update_consumer_consumer_by_pk($keycloakId: String!, $stripeCustomerId: String!) {
      update_consumer_consumer_by_pk(pk_columns: {keycloakId: $keycloakId}, _set: {stripeCustomerId: $stripeCustomerId}) {
         keycloakId
      }
   }
`
