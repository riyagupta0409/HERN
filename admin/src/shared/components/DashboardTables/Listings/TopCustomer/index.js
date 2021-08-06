import { useSubscription } from '@apollo/react-hooks'
import { reactFormatter, ReactTabulator } from '@dailykit/react-tabulator'
import '../../tableStyle.css'
import { Filler, Text } from '@dailykit/ui'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { logger } from '../../../../utils'
import { ErrorState } from '../../../ErrorState'
import { InlineLoader } from '../../../InlineLoader'
import { DashboardTableContext, DashboardTableProvider } from '../../context'
import { TOP_CUSTOMERS } from '../../graphql/subscription'
import { TableHeader } from '../../shared'
import TableOptions from '../../tableOptions'
const TopCustomer = () => {
   const { dashboardTableState } = React.useContext(DashboardTableContext)
   const [topCustomerList, setTopCustomerList] = useState([])
   const [status, setStatus] = useState({ loading: true })

   const { loading: subsLoading, error: subsError } = useSubscription(
      TOP_CUSTOMERS,
      {
         variables: {
            topCustomersArgs: {
               params: {
                  where: `id IS NOT NULL ${
                     dashboardTableState.from && dashboardTableState.to
                        ? `AND \"created_at\" >= '${dashboardTableState.from}' AND \"created_at\" <= '${dashboardTableState.to}'`
                        : ''
                  }`,
               },
            },
         },
         onSubscriptionData: ({ subscriptionData }) => {
            setTopCustomerList(
               subscriptionData.data.insights_analytics[0].getTopCustomers
            )
            setStatus({ ...status, loading: false })
         },
      }
   )
   const columns = [
      {
         title: `Revenue Generated (${dashboardTableState.currency})`,
         field: 'totalAmountPaid',
         formatter: reactFormatter(<RevenueFormatter />),
      },
      {
         title: 'Email',
         field: 'email',
      },
   ]
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
   if (topCustomerList.length == 0) {
      return <Filler message="No Top Customer Available" />
   }
   return (
      <>
         <TableHeader heading="Top Customer">
            <ReactTabulator
               data={topCustomerList}
               columns={columns}
               options={TableOptions}
               className="dashboard-table"
            />
         </TableHeader>
      </>
   )
}
const RevenueFormatter = ({ cell }) => {
   return (
      <>
         <Text as="text2">{cell._cell.value ? cell._cell.value : 0}</Text>
      </>
   )
}
export default TopCustomer
