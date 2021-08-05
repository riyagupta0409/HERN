import React from 'react';
import Main from './components/main'

import { ErrorBoundary } from '../../shared/components'


const App = () => {
    return (
        <ErrorBoundary>
           <Main/>
        </ErrorBoundary>
    )
}

export default App