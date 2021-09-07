export const GET_AVAILABLE_WEBHOOK_EVENT_ID = `
query GET_AVAILABLE_WEBHOOK_EVENT_ID($webhookEventLabel: String!) {
  developer_availableWebhookEvent(where: {label: {_eq: $webhookEventLabel}}) {
    id
  }
}
`

export const GET_URL_ENDPOINT_AND_ADVANCE_CONFIG = `
query GET_URL_ENDPOINT_AND_ADVANCE_CONFIG($processedWebhookEventsId: String = "") {
  developer_processedWebhookEventsByUrl(where: {processedWebhookEventsId: {_eq: $processedWebhookEventsId}}) {
    urlEndPoint
    webhookUrl_event {
      advanceConfig
    }
  }
}
`