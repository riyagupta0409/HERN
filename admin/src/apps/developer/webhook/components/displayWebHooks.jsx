import React , {useEffect,useState} from 'react';
import { useQuery } from '@apollo/react-hooks'
import {ACTIVE_EVENTS_WEBHOOKS } from '../graphql';
import { Loader } from '@dailykit/ui'
import {logger}  from '../../../../shared/utils'
import EventEmitter from 'events';
import {Table, TableHead, TableBody, TableRow, TableCell} from '@dailykit/ui'



function DisplayWebHooks(){

    const { loading, error, data } = useQuery(ACTIVE_EVENTS_WEBHOOKS);
    console.log("returned data " ,loading, error, data)
    if(loading) return <Loader />
    if(error) {
        logger(error)
        return null
    }

    function deleteEvent(eventId){
        console.log('working')
        console.log(eventId)
    }
    return (
        <div className="App" >
            <h1 align="center" >Active Events </h1>
            <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell align="left">URL</TableCell>
                    <TableCell >Action</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
            {data.developer_webhookUrl_events.map(event => 
                <TableRow key={event.id}>
               <TableCell> {event.availableWebhookEvent.label } </TableCell>
               <TableCell align="left">{ event.webhookUrl.urlEndpoint} </TableCell>
               <TableCell > <button onClick={() => deleteEvent(event.id)}>&#x1F5D1;</button> </TableCell>
               </TableRow>)}
            </TableBody>
            </Table>
          
        </div>

    )

}

export default DisplayWebHooks;