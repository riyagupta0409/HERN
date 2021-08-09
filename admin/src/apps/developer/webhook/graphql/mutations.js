import gql from 'graphql-tag'

export const INSERT_WEBHOOK_EVENTS = gql`
mutation MyMutation($urlEndpoint: String = "", $availableWebhookEventId: Int) {
    insert_developer_webhookUrl_events_one(object: {availableWebhookEventId: $availableWebhookEventId, webhookUrl: {data: {urlEndpoint: $urlEndpoint}, on_conflict: {constraint: webhookUrl_urlEndpoint_key, update_columns: updated_at}}}) {
      webhookUrlId
      availableWebhookEventId
    }
  }
  `

export const DELETE_WEBHOOK_EVENT = gql`
mutation MyMutation($eventId: Int) {
  delete_developer_webhookUrl_events(where: {id: {_eq: $eventId}}) {
    affected_rows
  }
}

`