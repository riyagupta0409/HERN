import axios from 'axios'; 
import { client } from '../../../lib/graphql';
import { GET_AVAILABLE_WEBHOOK_EVENT_ID_AND_EVENT_WEBHOOK_URLS, INSERT_PROCESSED_EVENT} from './graphql';


// for hasura admin secret in development mode 
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

/*
this controller is responsible for sending payload to all the webhook urls 
that are binded to a particular event whenever that event is triggered . 
It will be recieving the payload whenever the event is triggered 
then all the webhook urls binded to that event will be fetched from webhookUrl_events table 
and post request with the payload will be sent to each webhook url
along with the retry configuration.
*/
export const sendWebhookEvents = async (req , res) => {
    console.log('here')
    const processedWebhookEventId = req.body.event.data.new.id
    const payload = req.body.event.data.new.payload
    console.log(payload , processedWebhookEventId) 
    res.send('payload sent')
}

export const processWebhookEvents  = async (req , res) => {

    console.log("inside processWebhookEvents")
    
    const payload = req.body

    const eventName = req.body.trigger.name

    const response_availableWebhookEvent = await client.request(
        GET_AVAILABLE_WEBHOOK_EVENT_ID_AND_EVENT_WEBHOOK_URLS, { "webhookEventLabel": eventName }
     )
    const availableWebhookEventId = response_availableWebhookEvent.developer_availableWebhookEvent[0].id

    const response_insertProcessedEvent = await client.request(
        INSERT_PROCESSED_EVENT, {
            "availableWebhookEventId":availableWebhookEventId,
            "payload":payload
        }
    )
    console.log(response_insertProcessedEvent)
    // var webhookUrlArray =  response_availableWebhookEvent.developer_availableWebhookEvent[0].webhookUrl_events

    // webhookUrlArray.forEach(element=>{
    //     const urlEndpoint = element["webhookUrl"].urlEndpoint

    //     const response_webhook = axios({
    //         url: urlEndpoint,
    //         method:"POST",
    //         data:payload
    //     })

    // })
    res.send('request completed')
    // res.send('hi')
}




/*
this controller is responsible for handling event trigges state 
if the is active status of an event turns true then the event will be added in hasura events
and if the active status of an event turns false then the event will be removed from hasura events
using handleEvents.create and handleEvents.delete respectively 
*/
export const handleIsActiveEventTrigger = async (req , res) => {
    console.log('handling is active event trigger')
    try{
        if(req.body.event.data.old.isActive === false && req.body.event.data.new.isActive === true) {
            handleEvents.create(req, res)
        }else if(req.body.event.data.old.isActive === true && req.body.event.data.new.isActive === false){
            handleEvents.delete(req, res)
        }
        res.status(200).json({success: true , message: 'handled event trigger'})
    }catch(err){ return res
        .status(400)
        .json({ success: false, message: `request failed` })}
}

const handleEvents = {

    // create event in hasura events 
    create : async (req , res) => {
        try {
            const eventName = req.body.event.data.old.label
            const tableName = req.body.event.data.old.tableName
            const schemaName = req.body.event.data.old.schemaName

            await axios({
                   url:"https://test.dailykit.org/datahub/v1/query",
                    method:'POST',
                    headers:{
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Hasura-Role': 'admin',
                        "x-hasura-admin-secret" : process.env.HASURA_GRAPHQL_ADMIN_SECRET
                    },
                    data:{
                            "type" : "create_event_trigger",
                            "args" : {
                                "name": eventName,
                                "table": {
                                   "name": tableName,
                                   "schema":schemaName
                                },
                                "webhook": "http://aea7-122-173-27-84.ngrok.io/server/api/developer/webhookEvents/processWebhookEvents",
                                "insert": {
                                    "columns": "*",
                                    "payload": "*"
                                },
                                "replace": false                
                        }
                    }
            })
        } catch (err) {
            console.log(err)
        }
    
    } , 

    // delete event from hasura events 
    delete : async (req , res) => {
        try {
            const eventName = req.body.event.data.old.label
            const tableName = req.body.event.data.old.tableName
            const schemaName = req.body.event.data.old.schemaName

            const response = await axios({
                   url:"https://test.dailykit.org/datahub/v1/query",
                    method:'POST',
                    headers:{
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Hasura-Role': 'admin',
                        "x-hasura-admin-secret" : process.env.HASURA_GRAPHQL_ADMIN_SECRET
                    },
                    data:{
                            "type" : "delete_event_trigger",
                            "args" : {
                                "name": eventName,
                                "table": {
                                   "name": tableName,
                                   "schema":schemaName
                                },
                                "webhook": "http://aea7-122-173-27-84.ngrok.io/server/api/developer/webhookEvents/processWebhookEvents",
                                "insert": {
                                    "columns": "*",
                                    "payload": "*"
                                },
                                "replace": false
                        }
                    }
            })
        } catch (err) {
            console.log(err)
        }
    
    }

}
