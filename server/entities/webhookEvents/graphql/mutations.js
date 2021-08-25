export const INSERT_PROCESSED_EVENT = `
mutation MyMutation($availableWebhookEventId: Int = "$", $payload: jsonb = "") {
    insert_developer_processedWebhookEvents_one(object: {availableWebhookEventId: $availableWebhookEventId, payload: $payload}) {
      id
    }
  }
`