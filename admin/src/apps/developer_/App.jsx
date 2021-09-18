import React from 'react';
import { ErrorBoundary } from '../../shared/components';
import Main from './main';

const App = () => {
    return (
        // What is rootRoute
       <ErrorBoundary rootRoute="/apps/developer">     
          <Main />
       </ErrorBoundary>
    )
 }
 
 export default App