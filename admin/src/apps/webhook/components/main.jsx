import React , {useState} from 'react' ; 
import DisplayWebHooks from './displayWebHooks' ;
import AddWebHook from './addWebHook' 

const Main = () => {

    const [addOptionState , setAddOptionState] = useState(false)
    
    return(
        <>
        <button onClick={() => {setAddOptionState(true)}}>Add WebHook</button>
        
        {addOptionState && <AddWebHook />}
        <DisplayWebHooks />
        </>
    )
}

export default Main;