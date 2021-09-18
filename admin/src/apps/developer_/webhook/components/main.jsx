import React , {useState} from 'react' ; 
import DisplayWebHooks from './displayWebHooks' ;
import AddWebHook from './addWebHook';
import {TextButton, Spacer} from '@dailykit/ui';
import { Route } from 'react-router-dom';


const Main = () => {

    
    return(
        <>
            <Spacer size='16px' />
            
            <AddWebHook />
            <DisplayWebHooks />
        </>
    )
}

export default Main;