import Stripe from 'stripe'

import get_env from '../../get_env'

let stripe = async () => {
   const STRIPE_SECRET_KEY = await get_env('STRIPE_SECRET_KEY')
   return new Stripe(STRIPE_SECRET_KEY)
}

export default stripe
