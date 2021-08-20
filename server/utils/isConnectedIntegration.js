import get_env from '../../get_env'

export const isConnectedIntegration = async () => {
   const integrationType = await get_env('STRIPE_INTEGRATION_TYPE')
   if (integrationType === 'connected') {
      return true
   }
   return false
}
