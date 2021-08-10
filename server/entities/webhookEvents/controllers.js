import axios from 'axios'; 
import get_env from '../../../get_env';


export const handleIsActiveEventTrigger = async (req , res) => {
    console.log(req.body)
    res.send('here')
}

export const sendWebhookEvents  = async (req , res) => {
    console.log(req)
    res.send('hi')
}