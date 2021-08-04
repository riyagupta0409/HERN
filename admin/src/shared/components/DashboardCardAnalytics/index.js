import { useSubscription } from '@apollo/react-hooks'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { logger } from '../../utils'
import { Card, CardContainer, Cards } from '../DashboardCards'
import { ErrorState } from '../ErrorState'
import { InlineLoader } from '../InlineLoader'
import { GET_TOTAL_EARNING_ORDER_CUSTOMER } from './graphql/subscription'
//currencies
const currency = {
   USD: '$',
   INR: '₹',
   EUR: '€',
}
const DashboardCards = () => {
   const [analyticsData, setAnalyticsData] = useState({})
   const [status, setStatus] = useState({
      loading: true,
   })
   const { loading: subsLoading, error: subsError } = useSubscription(
      GET_TOTAL_EARNING_ORDER_CUSTOMER,
      {
         onSubscriptionData: ({ subscriptionData }) => {
            console.log('subscription data', subscriptionData)
            const total = {}
            total.totalEarnings =
               subscriptionData.data.ordersAggregate.aggregate.sum.amountPaid
            total.totalOrders =
               subscriptionData.data.ordersAggregate.aggregate.count
            total.totalCustomers =
               subscriptionData.data.customers_aggregate.aggregate.count
            setAnalyticsData(total)
            setStatus({ ...status, loading: false })
         },
      }
   )
   if (subsLoading || status.loading) {
      return <InlineLoader />
   }
   if (subsError) {
      logger(subsError)
      toast.error('Could not get the Insight data')
      return (
         <ErrorState height="320px" message="Could not get the Insight data" />
      )
   }
   return (
      <CardContainer bgColor="#F9F9F9" borderColor="#efefef">
         <CardContainer.Title>Here's your progress so far</CardContainer.Title>
         <Cards>
            <Card
               bgColor="#f9ebff"
               borderColor="#9e10e0"
               onClick={() => console.log('First')}
            >
               <Card.AdditionalBox justifyContent="space-between">
                  <svg
                     width="30"
                     height="30"
                     viewBox="0 0 30 30"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <path
                        d="M15 0.125C6.78555 0.125 0.125 6.78555 0.125 15C0.125 23.2145 6.78555 29.875 15 29.875C23.2145 29.875 29.875 23.2145 29.875 15C29.875 6.78555 23.2145 0.125 15 0.125ZM15.7404 22.2117L15.7471 23.2643C15.7471 23.4104 15.6275 23.5332 15.4814 23.5332H14.5385C14.3924 23.5332 14.2729 23.4137 14.2729 23.2676V22.225C11.3244 22.0059 9.93652 20.3258 9.78711 18.4996C9.77383 18.3436 9.89668 18.2107 10.0527 18.2107H11.5867C11.7162 18.2107 11.8291 18.3037 11.849 18.4299C12.0184 19.4824 12.8385 20.2693 14.3094 20.4652V15.7271L13.4893 15.518C11.7527 15.1029 10.0992 14.0205 10.0992 11.776C10.0992 9.35547 11.9387 8.05391 14.2895 7.8248V6.7291C14.2895 6.58301 14.409 6.46348 14.5551 6.46348H15.4881C15.6342 6.46348 15.7537 6.58301 15.7537 6.7291V7.81484C18.0281 8.04395 19.7348 9.37207 19.934 11.4406C19.9506 11.5967 19.8277 11.7328 19.6684 11.7328H18.1775C18.0447 11.7328 17.9318 11.6332 17.9152 11.5037C17.7824 10.5342 17.0055 9.74395 15.7404 9.57129V14.0305L16.5838 14.2264C18.7354 14.7576 20.1996 15.7869 20.1996 18.0912C20.1996 20.5914 18.3402 21.9859 15.7404 22.2117ZM12.1645 11.6232C12.1645 12.4666 12.6857 13.1207 13.808 13.5258C13.9641 13.5889 14.1201 13.6387 14.3061 13.6918V9.57461C13.0809 9.73066 12.1645 10.418 12.1645 11.6232ZM16.0326 16.1123C15.9396 16.0924 15.8467 16.0691 15.7404 16.0393V20.4785C17.1549 20.3523 18.1311 19.5754 18.1311 18.2738C18.1311 17.2545 17.6031 16.5904 16.0326 16.1123Z"
                        fill="#9E10E0"
                     />
                  </svg>
               </Card.AdditionalBox>
               <Card.Value currency={currency[window._env_.REACT_APP_CURRENCY]}>
                  {analyticsData.totalEarnings}
               </Card.Value>
               <Card.Text>Total Revenue Generated So Far</Card.Text>
            </Card>
            <Card bgColor="#FFF8EE" borderColor="#E08D10">
               <Card.Value>{analyticsData.totalOrders}</Card.Value>
               <Card.Text>Total No. Of Orders So Far</Card.Text>
            </Card>
            <Card bgColor="#F8ECEA" borderColor="#643A22">
               <Card.Value>{analyticsData.totalCustomers}</Card.Value>
               <Card.Text>Total No. Of Customer</Card.Text>
            </Card>
            <Card bgColor="#EDFCD8" borderColor="#8AC03B">
               <Card.Value>Spicy Prawn Pasta with Red Pepper Sauce</Card.Value>
               <Card.Text>Most Sold Product</Card.Text>
            </Card>
         </Cards>
      </CardContainer>
   )
}
export default DashboardCards
