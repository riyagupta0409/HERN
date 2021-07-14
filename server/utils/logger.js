import axios from 'axios'
import get_env from '../../get_env'

export const logger = async args => {
   try {
      const PLATFORM_URL = await get_env('PLATFORM_URL')
      const DATA_HUB = await get_env('DATA_HUB')
      await axios({
         method: 'POST',
         url: `${PLATFORM_URL}/api/report/error`,
         data: {
            ...args,
            from: {
               url: new URL(DATA_HUB).origin
            }
         }
      })
   } catch (error) {
      console.log('failed to report error', error)
   }
}
