export const GET_EVENT_WEBHOOK_URLS = `
query MyQuery($webhookEvent: String = "") {
    developer_webhookUrl_events(where: {availableWebhookEvent: {label: {_eq: $webhookEvent}}}) {
      webhookUrl {
        urlEndpoint
      }
    }
  }  
`

export const GET_AVAILABLE_WEBHOOK_EVENT_ID = `
query MyQuery($eventName:String) {
  developer_availableWebhookEvent(where: {label: {_eq: $eventName}}) {
    id
  }
}

`