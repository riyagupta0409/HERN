import React , {useEffect,useState} from 'react';
import {AVAILABLE_EVENTS } from '../graphql';
import { Loader } from '@dailykit/ui'
import { useQuery } from '@apollo/react-hooks'
import {logger}  from '../../../shared/utils'
import {TextButton , Form, Spacer, Text , Select } from '@dailykit/ui'


function AddWebHook(props){

    const [selectedEvent , updateSelectedEvent] = useState(null)
    const [inputWebhookUrl , updatedInputWebhookUrl] = useState(null)

    const submitForm = () => {
        console.log(selectedEvent , inputWebhookUrl);
        props.closeForm()
    }
    
    
    const {loading, error, data} = useQuery(AVAILABLE_EVENTS);
    if (loading) return <Loader />;

    if (error) {
        logger(error)
        return null;
    }

    else{

        var options = [{ id:0, value: ' ', title: 'select event' }]
        const availableEvents = data.developer_availableWebhookEvent.map(event =>
            ({id:event.id , value : event.id , title : event.label }))
        var options = [...options , ...availableEvents]
        return (
            <>
                <Text as='h3'>Add Webhook</Text>
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
                <TextButton type='solid' size='md' onClick={() => submitForm()}>
                Create Event
                </TextButton>
            </>
        )
    }

    
}   

export default AddWebHook;