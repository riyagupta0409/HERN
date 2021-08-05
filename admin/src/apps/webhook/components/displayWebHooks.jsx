import React , {useEffect,useState} from 'react';
import { useQuery } from '@apollo/react-hooks'
import {ACTIVE_EVENTS_WEBHOOKS } from '../graphql';
import { Loader } from '@dailykit/ui'
import {logger}  from '../../../shared/utils'
import EventEmitter from 'events';



function DisplayWebHooks(){

    const { loading, error, data } = useQuery(ACTIVE_EVENTS_WEBHOOKS);
    console.log("returned data " ,loading, error, data)
    if(loading) return <Loader />
    if(error) {
        logger(error)
        return null
    }
    // if(data.customers.length === 0) {
    //     return <span>There's no customer's yet</span>
    // }
//   return (
//     <div className="App">
//       {data.customers.map(customer => <span>{customer.firstName}</span>)}
//     </div>
//   );
    console.log(data)
    return (
        <div className="App" >
            <h3 >Active Events </h3>
           {data.developer_webhookUrl_events.map(event => <span key={event.Id}>
               {event.availableWebhookEvent.label } -- { event.webhookUrl.urlEndpoint}
               </span>)}
        </div>
    )

}

export default DisplayWebHooks;