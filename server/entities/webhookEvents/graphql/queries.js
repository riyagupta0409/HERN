export const GET_EVENT_WEBHOOK_URLS = `
query MyQuery($webhookEvent: String = "") {
    developer_webhookUrl_events(where: {availableWebhookEvent: {label: {_eq: $webhookEvent}}}) {
      webhookUrl {
        urlEndpoint
      }
    }
  }  
`