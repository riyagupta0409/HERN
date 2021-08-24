import axios from 'axios'; 
import { client } from '../../lib/graphql';

if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

export const handleIsActiveEventTrigger = async (req , res) => {
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

    // create event trigger
    create : async (req , res) => {
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
                            "type" : "create_event_trigger",
                            "args" : {
                                "name": eventName,
                                "table": {
                                   "name": tableName,
                                   "schema":schemaName
                                },
                                "webhook": "http://c138-103-119-165-40.ngrok.io/server/api/handleWebhookEvents/sendWebhookEvents",
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

    // delete event trigger 
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
                                "webhook": "http://c138-103-119-165-40.ngrok.io/server/api/handleWebhookEvents/sendWebhookEvents",
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


export const sendWebhookEvents  = async (req , res) => {
    
    const payload = req.body

    const eventName = req.body.trigger.name

    const response = await client.request(
        GET_AVAILABLE_WEBHOOK_EVENT_ID, { "eventName": eventName }
     )

     const availableWebhookEventId = response.developer_availableWebhookEvent[0].id

     console.log(availableWebhookEventId)



    res.send('hi')
}

const GET_AVAILABLE_WEBHOOK_EVENT_ID = `
query MyQuery($eventName:String) {
  developer_availableWebhookEvent(where: {label: {_eq: $eventName}}) {
    id
  }
}

`