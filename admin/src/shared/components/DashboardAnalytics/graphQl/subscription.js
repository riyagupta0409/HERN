import gql from 'graphql-tag'

const INSIGHT_ANALYTICS = gql`
   subscription insights_analytics($args: insights_getTotalEarnings_args!) {
      insights_analytics {
         id
         getTotalEarnings(args: $args)
      }
   }
`
export const GET_TOTAL_EARNING = gql`
   subscription GET_TOTAL_EARNING($args: insights_getTotalEarnings_args!) {
      insights_analytics {
         getTotalEarnings(args: $args)
      }
   }
`
export const TOTAL_ORDER_RECEIVED = gql`
   subscription TOTAL_ORDER_RECEIVED($args: insights_getOrdersRecieved_args!) {
      insights_analytics {
         getOrdersRecieved(args: $args)
      }
   }
`
export const BRANDS = gql`
   subscription BRANDS {
      brands(where: { isArchived: { _eq: false } }, order_by: { title: asc }) {
         title
         isDefault
         id
      }
   }
`
