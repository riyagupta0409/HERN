import Home from './views';
import { Route } from 'react-router-dom';
import React from 'react';
import WebhookApp from './webhook';


const Main = () => {
    return (
        <>
            <Route exact path="/developer">

                <Home />

            </Route>

            <Route exact path="/developer/webhook">
                <WebhookApp />
            </Route>
        </>
    )
}

export default Main;