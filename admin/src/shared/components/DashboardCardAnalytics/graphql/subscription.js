import gql from 'graphql-tag'

export const GET_TOTAL_EARNING_ORDER_CUSTOMER = gql`
   query TotalEarningAndTotalOrder {
      ordersAggregate(
         where: {
            isAccepted: { _eq: true }
            cart: { paymentStatus: { _eq: "SUCCEEDED" } }
         }
      ) {
         aggregate {
            sum {
               amountPaid
            }
            count
         }
      }
      customers_aggregate {
         aggregate {
            count
         }
      }
   }
`
