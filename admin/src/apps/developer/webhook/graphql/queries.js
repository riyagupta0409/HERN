import gql from 'graphql-tag'


export const ACTIVE_EVENTS_WEBHOOKS = gql`
    query MyQuery {
        developer_webhookUrl_events {
          id
          availableWebhookEvent {
            description
            id
            isActive
            label
            samplePayload
            schemaName
            tableName
            type
          }
          webhookUrl {
            id
            isActive
            created_at
            updated_at
            urlEndpoint
          }
        }
      }
      
    `
  

export const  AVAILABLE_EVENTS = gql`
    query AVAILABLE_EVENTS {
      developer_availableWebhookEvent {
        id
        description
        isActive
        label
        samplePayload
        schemaName
        tableName
        type
      }
    }
    
    `