import React from 'react';
import {TextButton , Form, Spacer, Text, ButtonGroup, Select, Tunnel, useTunnel, TunnelHeader, Tunnels } from '@dailykit/ui'



function addWebhookTunnels(props){
    return (
        <>
        {!props.addOptionState &&
            <TextButton type="solid" align="right" onClick={() => {props.setAddOptionState(true);props.openTunnel(1)}}>Add WebHook</TextButton>
            }
            <Tunnels tunnels={props.tunnels}>
                <Tunnel style={{padding:10}} layer={1}>

                    <TunnelHeader
                    title="Select Event Webhook"
                    close={() => {props.closeTunnel(1);props.setAddOptionState(false)}}
                    description='This is for selecting event'
                    
                    right={
                        {
                            title: 'Next',
                            action: () => props.openTunnel(2)
                        }
                    }
                />
                    
                    <Spacer size='16px' />
                    <Form.Group>
                        <Form.Label htmlFor='webhookEvent' title='webhookEvent'>
                    Select Event
                        </Form.Label>
                        <Form.Select id='webhookEvent' name='webhookEvent' options={props.options} onChange={(e) => {props.updateSelectedEvent(e.target.value)}} placeholder='Select an Event' />
                    </Form.Group>
                    <Spacer size='16px' />
                    
                    
                </Tunnel>
                <Tunnel style={{padding:10}} layer={2}>
                    <TunnelHeader
                        title="Enter Webhook URL"
                        close={() => props.closeTunnel(2)}
                        description='This is for entering webhook url'
                        
                        right={
                            {
                                title: 'Create',
                                action: () => {props.submitForm();props.setAddOptionState(false)}
                            }
                        }
                    />
                    <Spacer size='16px' />
                    <Form.Group>
                    <Form.Label htmlFor='webhookUrl' title='webhookUrl'>
                    Add Webhook URL
                    </Form.Label>
                    <Form.Text
                    id='webhookUrl'
                    name='webhookUrl'
                    onChange={(e) => {props.updatedInputWebhookUrl(e.target.value)}}
                    placeholder='Enter the webhook URL..'
                    />
                    <Spacer size='24px' />
                    <Text as='h3'>Advance Configs</Text>
                    <Spacer size='16px' />
                    <Form.Label htmlFor='numberOfRetries' title='numberOfRetries'>
                        Number of Retries
                    </Form.Label>
                    <Form.Number
                        id='numberOfRetries'
                        name='numberOfRetries'
                        onChange={(e) => {props.updatedInputAdvanceCofigs({"timeOut":props.inputAdvanceConfigs.timeOut, "retryInterval":props.inputAdvanceConfigs.retryInterval, "numberOfRetries":parseInt(e.target.value)})}}
                        placeholder='Enter number of retries'
                    />
                    <Spacer size='16px' />
                    <Form.Label htmlFor='retryInterval' title='retryInterval'>
                        Retry Interval (sec)
                    </Form.Label>
                    <Form.Number
                        id='retryInterval'
                        name='retryInterval'
                        onChange={(e) => {props.updatedInputAdvanceCofigs({"timeOut":props.inputAdvanceConfigs.timeOut, "retryInterval":parseInt(e.target.value), "numberOfRetries":props.inputAdvanceConfigs.numberOfRetries})}}
                        placeholder='Enter retry interval'
                    />
                    <Spacer size='16px' />
                    <Form.Label htmlFor='timeOut' title='timeOut'>
                        Timeout (sec)
                    </Form.Label>
                    <Form.Number
                        id='timeOut'
                        name='timeOut'
                        onChange={(e) => {props.updatedInputAdvanceCofigs({"timeOut":parseInt(e.target.value), "retryInterval":props.inputAdvanceConfigs.retryInterval, "numberOfRetries":props.inputAdvanceConfigs.numberOfRetries})}}
                        placeholder='Enter timeout'
                    />
                    </Form.Group>
                    <Spacer size='25px' />
                </Tunnel>
            </Tunnels>
        </>
    )
}

export default addWebhookTunnels