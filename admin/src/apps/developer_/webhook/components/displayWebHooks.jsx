import React , {useEffect,useState} from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/react-hooks'
import {ACTIVE_EVENTS_WEBHOOKS, DELETE_WEBHOOK_EVENT } from '../graphql';
import { Loader } from '@dailykit/ui'
import {logger}  from '../../../../shared/utils'
import {Table, TableHead, TableBody, TableRow, TableCell} from '@dailykit/ui';
import { toast } from 'react-toastify'
// third party imports
import { useTranslation } from 'react-i18next'



function DisplayWebHooks(){

    const { t } = useTranslation()

    // Mutation for deleting webhook
    const [deleteWebhook, {loading: deletingWebhookLoading}] = useMutation(DELETE_WEBHOOK_EVENT);

    // Query to fetch active webhook events
    const { loading, error, data } = useSubscription(ACTIVE_EVENTS_WEBHOOKS);
    if(loading || deletingWebhookLoading) return <Loader />
    if(error) {
        logger(error)
        return null
    }

    
    // To delete Webhook
    function deleteEvent(eventId){
        deleteWebhook({
            variables:{
                "eventId":eventId
            },
            onComplete : (data) => {
                console.log('request completed')
                toast.success('webhook successfully deleted')
                console.log(data)
            },
            onError : (error) =>{

                toast.error('Something went wrong')
                logger(error)
            }
        })
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