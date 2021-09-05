export const GET_AVAILABLE_WEBHOOK_EVENT_ID_AND_EVENT_WEBHOOK_URLS = `
query GET_AVAILABLE_WEBHOOK_EVENT_ID_AND_EVENT_WEBHOOK_URLS($webhookEventLabel: String!) {
  developer_availableWebhookEvent(where: {label: {_eq: $webhookEventLabel}}) {
    id
    webhookUrl_events(where: {webhookUrl: {isActive: {_eq: true}}}) {
      webhookUrl {
        urlEndpoint
        id
      }
      advanceConfig
    }
  }
}
`