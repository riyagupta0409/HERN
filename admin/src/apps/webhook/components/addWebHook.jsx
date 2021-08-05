import React , {useEffect,useState} from 'react';
import { Select } from '@dailykit/ui';
import {AVAILABLE_EVENTS } from '../graphql';
import { Loader } from '@dailykit/ui'
import { useQuery } from '@apollo/react-hooks'
import {logger}  from '../../../shared/utils'


function AddWebHook(){

    const {loading, error, data} = useQuery(AVAILABLE_EVENTS);
    console.log(loading, error, data);
    if (loading) return <Loader />;
    if (error) {
        logger(error)
        return null;
    }
    else{
        // updateAvailableEvents()
        console.log(data , "here is data ");
        return (
            <form>
                <label>Select Event <br/>
                    <select>
                    {data.developer_availableWebhookEvent.map(event =><option key={event.id} value={event.id}>{event.label}</option> )}
                    </select>
                </label>
                <br/>
                <label>
                    Add Webhook URL <br/>
                    <input type="text" id="webhookUrl" placeholder="Add Webhook URL"></input>
                </label>
                <br/>
                <button onClick={}>Create Webhook</button>
            </form>
        )
    }

    
}   

export default AddWebHook;