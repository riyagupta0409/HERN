import Home from '../../views/Home';
import { Route } from 'react-router-dom';
import React from 'react';
import WebhookListing from '../../views/Listing/webhooks';
import WebhookEdit from '../../views/Forms/webhookEdit'

const Main = () => {
    return (
        <>
        
            <Route exact path="/developer" component={ Home } />
            <Route exact path="/developer/webhook" component={ WebhookListing } />
            <Route exact path="/developer/webhook/:id" component={ WebhookEdit } />

        </>
    )
}

export default Main;