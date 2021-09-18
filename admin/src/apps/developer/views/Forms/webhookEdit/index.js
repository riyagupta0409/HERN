import { useParams } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import {
   Flex,
   HorizontalTab,
   HorizontalTabs,
   HorizontalTabList,
   HorizontalTabPanel,
   HorizontalTabPanels,
   Form,
   Spacer,
   Text,
} from '@dailykit/ui'
import {
    StyledWrapper,
    StyledComp,
    InputWrapper,
    StyledDiv,
    StyledInsight,
 } from './styled'
 import {
    Banner,
    Tooltip,
    InlineLoader,
    InsightDashboard,
 } from '../../../../../shared/components'


const WebhookEdit = ()=>{
    const { id: webhookUrl_EventId } = useParams()

    return (
        <StyledDiv>
               <HorizontalTabs>
                  <div className="styleTab">
                     <HorizontalTabList>
                        <HorizontalTab>Modify</HorizontalTab>
                        <HorizontalTab>Processed Webhook Events</HorizontalTab>
                        <HorizontalTab>Invocation logs</HorizontalTab>
                     </HorizontalTabList>
                  </div>
                  <HorizontalTabPanels>
                     <HorizontalTabPanel>
                        
                     </HorizontalTabPanel>
                     <HorizontalTabPanel>
                       
                     </HorizontalTabPanel>
                     <HorizontalTabPanel>
                       
                     </HorizontalTabPanel>
                  </HorizontalTabPanels>
               </HorizontalTabs>
            </StyledDiv>
    )
}

export default WebhookEdit;