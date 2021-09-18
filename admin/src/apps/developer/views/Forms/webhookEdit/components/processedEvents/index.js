import React, {useRef, useState} from 'react';
import { ReactTabulator } from '@dailykit/react-tabulator'
import {Table, TableHead, TableBody, TableRow, TableCell, Flex, TextButton, Text, Spacer, DropdownButton, ButtonGroup, ComboButton, PlusIcon, useTunnel} from '@dailykit/ui';
import options from '../../../../tableOptions'
import { GET_PROCESSED_EVENTS } from '../../../../../graphql';
import { useSubscription, useMutation } from '@apollo/react-hooks'
import { toast } from 'react-toastify'
import {logger}  from '../../../../../../../shared/utils'
import { StyledWrapper } from './styled'


const ProcessedEvents = (props)=>{

    const [processedEvents, setProcessedEvents] = useState([])

    const webhookUrl_EventId = props.webhookUrl_EventId

    const { data, loading, error } = useSubscription(GET_PROCESSED_EVENTS, {
      variables:{
          webhookUrl_EventId: webhookUrl_EventId
       },
       onSubscriptionData:({ subscriptionData: { data = {} } = {} })=> {
           const processedEventsData = data.developer_webhookUrl_events[0]?.availableWebhookEvent.processedWebhookEvents.map((item)=>{
            if (item.processedWebhookEventsByUrls[0]){
            const newData =  { "created_at":item.created_at, 
               "statusCode":item.processedWebhookEventsByUrls[0].statusCode,
               "attemptedTime":item.processedWebhookEventsByUrls[0].attemptedTime}
               return newData;
            }
            
            
        })
         setProcessedEvents(processedEventsData)
       },
      })

    if (error) {
      toast.error('Something went wrong')
      logger(error)
   }

    const tableRef = useRef()

    const columns = [
        {
           title: 'created at',
           field: 'created_at',
           headerFilter: true,
           hozAlign: 'left',
           resizable:true,
           headerSort:true,
           cssClass: 'rowClick',
           width: 300,
        //    cellClick: (e, cell) => {
        //       rowClick(e, cell)
        //    }
           // headerTooltip: function (column) {
           //    const identifier = 'webhook_listing_code_column'
           //    return (
           //       tooltip(identifier)?.description || column.getDefinition().title
           //    )
           // },
        },
        {
           title: 'status',
           field: 'statusCode',
           headerFilter: true,
           hozAlign: 'left',
           resizable:true,
           headerSort:true,
           cssClass: 'rowClick',
           width: 300
        },
        {
            title: 'tries',
            field: 'attemptedTime',
            headerFilter: true,
            hozAlign: 'left',
            resizable:true,
            headerSort:true,
            cssClass: 'rowClick',
            width: 300
         }
     ]

    return (
        <>
            <div className="App" >
            <StyledWrapper>
            <Flex container alignItems="center" justifyContent="space-between">
            <Flex container height="80px" alignItems="center">
               <Text as="h2">
                  Procesed Events
                  {/* (
                  {webhookUrl_eventsCount || '...'}) */}
               </Text>
               {/* <Tooltip identifier="coupon_list_heading" /> */}
            </Flex>
                  

            <ButtonGroup>
               {/* <ComboButton type="solid" 
               onClick={()=>openTunnel(1)}
               >
                  <PlusIcon />
                  Add Webhook
               </ComboButton> */}
            </ButtonGroup>
         </Flex>
         {Boolean(processedEvents) && (
            <ReactTabulator
               columns={columns}
               data={processedEvents}
               options={{
                  ...options,
                  placeholder: 'No processed events Available Yet !',
                  persistenceID : 'processedEvents_table'
               }}
               ref={tableRef}
               className = 'developer-webhooks-processedEvents'
            />
         )}
         </StyledWrapper>
        </div>
        </>
    )
}

export default ProcessedEvents;