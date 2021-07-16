import gql from 'graphql-tag'

const INSIGHT_ANALYTICS = gql`
   subscription insights_analytics($args: insights_getTotalEarnings_args!) {
      insights_analytics {
         id
         getTotalEarnings(args: $args)
      }
   }
`
