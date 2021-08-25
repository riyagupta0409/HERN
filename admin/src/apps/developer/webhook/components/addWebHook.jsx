import React , {useEffect,useState} from 'react';
import {AVAILABLE_EVENTS, INSERT_WEBHOOK_EVENTS } from '../graphql';
import { Loader } from '@dailykit/ui'
import { useQuery, useMutation } from '@apollo/react-hooks'
import {logger}  from '../../../../shared/utils'
import {TextButton , Form, Spacer, Text, ButtonGroup, Select, Tunnel, useTunnel, TunnelHeader } from '@dailykit/ui'
import { toast } from 'react-toastify'

function AddWebHook(props){

    // react states for reference to values of selected event and input url Endpoint
    const [selectedEvent , updateSelectedEvent] = useState(null)
    const [inputWebhookUrl , updatedInputWebhookUrl] = useState(null)

    // mutation for creating new webhook 
    const [insertWebhookEventUrl, {loading : webhookLoading}] = useMutation(INSERT_WEBHOOK_EVENTS ,{
        onComplete : (data) => {
            toast.success('webhook successfully created')
        },
        onError : (error) =>{
            toast.error('Something went wrong (Ex. current webhook already exist)')
            logger(error)
        },
        
    })

    // on submitting form (or clicking create event button )
    const submitForm = () => {

        // add validation for checking if the values are not empty [~ pending ]
        if(selectedEvent === '' || selectedEvent == null ){
            toast.error('Please select an event')
            return 
        }
        else if(inputWebhookUrl === '' || inputWebhookUrl === null) {
            toast.error('URL end point must not be empty')
            return 
        }else if(inputWebhookUrl !== null){
            // adding regex to handle valid url value 
            var expression = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
            var regex = new RegExp(expression);
            if (!inputWebhookUrl.match(regex)) {
                toast.error("invalid url value");
                return
              } else{     
                // call mutation 
                insertWebhookEventUrl({
                    variables:{
                        "urlEndpoint": inputWebhookUrl,
                        "availableWebhookEventId": selectedEvent
                    }
                })
    
                // to check if the mutation result is still loading 
                if(webhookLoading){
                    return <Loader/>
                }else{
                    // closing form 
                props.closeForm();
                }
            }

        }
        
        
    }
    
    
    // query to fetch the available events to show in the form 
    const {loading, error, data} = useQuery(AVAILABLE_EVENTS);
    if (loading) return <Loader />;

    if (error) {
        logger(error)
        return null;
    }

    else{

        var options = [{ id:0, value: '', title: 'select event' }]
        const availableEvents = data.developer_availableWebhookEvent.map(event =>
            ({id:event.id , value : event.id , title : event.label }))
        var options = [...options , ...availableEvents]
        return (
            <>
                <Tunnel style={{padding:10}}>

                    <TunnelHeader
                    title="Add Webhook"
                    close={() => props.closeForm()}
                    description='This is for adding webhook'
                    
                    right={
                        {
                            title: 'Create',
                            action: () => submitForm()
                        }
                    }
                />
                    
                    <Spacer size='16px' />
                    <Form.Group>
                        <Form.Label htmlFor='webhookEvent' title='webhookEvent'>
                    Select Event
                        </Form.Label>
                        <Form.Select id='webhookEvent' name='webhookEvent' options={options} onChange={(e) => {updateSelectedEvent(e.target.value)}} placeholder='Select an Event' />
                    </Form.Group>
                    <Spacer size='16px' />
                    <Form.Group>
                    <Form.Label htmlFor='webhookUrl' title='webhookUrl'>
                    Add Webhook URL
                    </Form.Label>
                    <Form.Text
                    id='webhookUrl'
                    name='webhookUrl'
                    onChange={(e) => {updatedInputWebhookUrl(e.target.value)}}
                    placeholder='Enter the webhook URL..'
                    />
                    </Form.Group>
                    <Spacer size='25px' />
                    <ButtonGroup align="left">
                        <TextButton type='solid' size='md' onClick={() => submitForm()}>
                        Create Event
                        </TextButton>
                        <TextButton type='solid' size='md' onClick={() => props.closeForm()}>
                        Cancel
                        </TextButton>
                    </ButtonGroup>
                    
                </Tunnel>
            </>
        )
    }

    
}   

export default AddWebHook;