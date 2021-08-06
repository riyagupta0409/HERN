import React , {useState} from 'react' ; 
import DisplayWebHooks from './displayWebHooks' ;
import AddWebHook from './addWebHook' 
import {TextButton} from '@dailykit/ui' 

const Main = () => {

    const [addOptionState , setAddOptionState] = useState(false)
    const closeForm = () =>{
        setAddOptionState(false)
    }
    
    return(
        <>
        {!addOptionState &&
        <TextButton align="right" onClick={() => {setAddOptionState(true)}}>Add WebHook</TextButton>
        }
        
        {addOptionState && <AddWebHook closeForm = {closeForm}/>}
        <DisplayWebHooks />
        </>
    )
}

export default Main;