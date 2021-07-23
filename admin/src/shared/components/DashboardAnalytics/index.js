import { useSubscription } from '@apollo/react-hooks'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import './style.css'
import './tableStyle.css'
import { Expand } from '../../assets/icons'
import { toast } from 'react-toastify'
import { logger } from '../../utils'
import { Tile, Tiles } from '../DashboardTiles'
import { ErrorState } from '../ErrorState'
import { InlineLoader } from '../InlineLoader'
import { INSIGHT_ANALYTICS } from './graphQl/queries'
import 'react-day-picker/lib/style.css'
import { DatePicker, Space } from 'antd'
import 'antd/dist/antd.css'
import { Area, AreaChart, Tooltip, XAxis, YAxis } from 'recharts'
import moment from 'moment'
import TableOptions from './tableOptions'
import {
   Dropdown,
   Text,
   Spacer,
   TextButton,
   ButtonGroup,
   Flex,
   RadioGroup,
   Tunnels,
   Tunnel,
   useTunnel,
   TunnelHeader,
} from '@dailykit/ui'
import { groupBy } from 'lodash'
import { reactFormatter, ReactTabulator } from '@dailykit/react-tabulator'
import { useTabs } from '../../providers'
import { BRANDS } from './graphQl/subscription'
import {
   TotalEarningTunnel,
   TotalOrderRecTunnel,
} from './Tunnels/DrillDownTunnel'
import OrderRefTable from './Tunnels/OrderRefTunnel/orderRefTunnel'
const { RangePicker } = DatePicker

//currencies
const currency = {
   USD: '$',
   INR: '₹',
   EUR: '€',
}

const DashboardAnalytics = () => {
   const [from, setFrom] = useState(
      localStorage.getItem('analyticsDateFrom') || moment().format('YYYY-MM-DD')
   )
   const [to, setTo] = useState(
      localStorage.getItem('analyticsDateTo') ||
         moment().add(1, 'd').format('YYYY-MM-DD')
   )
   const [compare, setCompare] = useState({
      isCompare: false,
      data: null,
      isRun: false,
      from: from,
      to: to,
      compareResult: null,
      isSkip: true,
   })
   const [groupBy, setGroupBy] = useState([
      'year',
      'month',
      'week',
      'day',
      'hour',
   ])
   const [brandShop, setBrandShop] = useState({
      brandId: undefined,
      shopTitle: false,
      brand: undefined,
   })
   const [tunnels, openTunnel, closeTunnel] = useTunnel(2)
   const [tunnelTitle, setTunnelTitle] = useState('')
   const [graphTunnels, openGraphTunnel, closeGraphTunnel] = useTunnel(1)
   const [graphTunnelData, setGraphTunnelData] = useState({
      title: undefined,
      orderRefData: undefined,
      presentTime: undefined,
      pastTime: undefined,
   })
   const [insightSkip, setInsightSkip] = useState(true)
   const { data: { brands = [] } = {}, loading: brandLoading } =
      useSubscription(BRANDS, {
         onSubscriptionData: ({ subscriptionData }) => {
            const defaultBrand = subscriptionData.data.brands.find(
               x => x.isDefault == true
            )
            if (defaultBrand) {
               setBrandShop({
                  ...brands,
                  brandId: defaultBrand.id,
                  brand: defaultBrand,
               })
               setInsightSkip(false)
            }
         },
      })

   //subscription
   const {
      data: { insights_analytics = [] } = {},
      loading: subsLoading,
      error: subsError,
   } = useSubscription(INSIGHT_ANALYTICS, {
      variables: {
         //totalEarning
         args: {
            params: {
               where: `"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' ${
                  from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at >= '${from}'`
               } ${
                  from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at < '${to}'`
               } AND a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         //totalAcceptedVsRejectedOrders
         args1: {
            params: {
               where: `${
                  from !== moment('2017 - 01 - 01') &&
                  `a.created_at >= '${from}' AND`
               } ${
                  from !== moment('2017 - 01 - 01') &&
                  `a.created_at < '${to}' AND`
               } a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args2: {
            params: {
               where: `${
                  from !== moment('2017 - 01 - 01') &&
                  `a.created_at >= '${from}' AND`
               } ${
                  from !== moment('2017 - 01 - 01') &&
                  `a.created_at < '${to}' AND`
               } a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args3: {
            params: {
               where: `"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' ${
                  from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at >= '${from}'`
               } ${
                  from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at < '${to}'`
               } AND a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args4: {
            params: {
               where: `${
                  from !== moment('2017 - 01 - 01') &&
                  `a.created_at >= '${from}' AND`
               } ${
                  from !== moment('2017 - 01 - 01') &&
                  `a.created_at < '${to}' AND`
               } a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args5: {
            params: {
               where: `a.\"isSubscriber\" = true AND  a.\"isSubscriberTimeStamp\" IS NOT NULL ${
                  from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at >= '${from}'`
               } ${
                  from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at < '${to}'`
               } AND a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
      },
      skip: insightSkip,
   })
   // subscription for for compare data
   useSubscription(INSIGHT_ANALYTICS, {
      variables: {
         //totalEarning
         args: {
            params: {
               where: `"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at >= '${compare.from}'`
               } ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at < '${compare.to}'`
               } AND a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         //totalAcceptedVsRejectedOrders
         args1: {
            params: {
               where: `${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `a.created_at >= '${compare.from}' AND`
               } ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `a.created_at < '${compare.to}' AND`
               } a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args2: {
            params: {
               where: `${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `a.created_at >= '${compare.from}' AND`
               } ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `a.created_at < '${compare.to}' AND`
               } a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args3: {
            params: {
               where: `"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at >= '${compare.from}'`
               } ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at < '${compare.to}'`
               } AND a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args4: {
            params: {
               where: `${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `a.created_at >= '${compare.from}' AND`
               } ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `a.created_at < '${compare.to}' AND`
               } a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
         args5: {
            params: {
               where: `a.\"isSubscriber\" = true AND  a.\"isSubscriberTimeStamp\" IS NOT NULL ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at >= '${compare.from}'`
               } ${
                  compare.from !== moment('2017 - 01 - 01') &&
                  `AND a.created_at < '${compare.to}'`
               } AND a."brandId" = ${brandShop.brandId} ${
                  brandShop.shopTitle
                     ? `AND b.source = \'${brandShop.shopTitle}\'`
                     : ''
               }`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
      },
      skip: compare.isSkip,
      onSubscriptionData: ({ subscriptionData }) => {
         setCompare(prevState => ({
            ...prevState,
            data: subscriptionData.data.insights_analytics[0],
         }))
         dataCompareMachine(subscriptionData.data.insights_analytics[0])
      },
   })
   const dataCompareMachine = data => {
      const result = {}
      const present = insights_analytics[0]
      const past = data
      //getTotalEarning
      const getTotalEarningsResult = {}
      const presentTotalEarnings = present.getTotalEarnings[0].total
      const pastTotalEarnings = past.getTotalEarnings[0].total
      const compareTotalEarnings = presentTotalEarnings - pastTotalEarnings

      getTotalEarningsResult.isGrowth = compareTotalEarnings >= 0 ? true : false
      getTotalEarningsResult.growth = compareTotalEarnings
      getTotalEarningsResult.growthInPercentage = (
         (Math.abs(compareTotalEarnings) / pastTotalEarnings) *
         100
      ).toFixed(2)
      result.getTotalEarnings = getTotalEarningsResult

      //getOrdersRecieved
      const getOrdersRecievedResult = {}
      const presentOrderRecieved = present.getOrdersRecieved.find(
         x => x.year == null
      ).count
      const pastOrderRecieved = past.getOrdersRecieved.find(
         x => x.year == null
      ).count
      const compareOrderRecieved = presentOrderRecieved - pastOrderRecieved

      getOrdersRecievedResult.isGrowth =
         compareOrderRecieved >= 0 ? true : false
      getOrdersRecievedResult.growth = compareOrderRecieved
      getOrdersRecievedResult.growthInPercentage = (
         (Math.abs(compareOrderRecieved) / pastOrderRecieved) *
         100
      ).toFixed(2)
      result.getOrdersRecieved = getOrdersRecievedResult

      //getAcceptedVsRejectedOrders-->accepted
      const getAcceptedOrdersResult = {}
      const presentAccepted = present.getAcceptedVsRejectedOrders.acceptedCount
      const pastAccepted = past.getAcceptedVsRejectedOrders.acceptedCount
      const compareAccepted = presentAccepted - pastAccepted

      getAcceptedOrdersResult.isGrowth = compareAccepted >= 0 ? true : false
      getAcceptedOrdersResult.growth = compareAccepted
      getAcceptedOrdersResult.growthInPercentage = (
         (Math.abs(compareAccepted) / pastAccepted) *
         100
      ).toFixed(2)
      result.getAcceptedOrders = getAcceptedOrdersResult

      //getAcceptedVsRejectedOrders-->Rejected
      const getRejectedOrdersResult = {}
      const presentRejected = present.getAcceptedVsRejectedOrders.rejectedCount
      const pastRejected = past.getAcceptedVsRejectedOrders.rejectedCount
      const compareRejected = presentRejected - pastRejected

      getRejectedOrdersResult.isGrowth = compareRejected >= 0 ? true : false
      getRejectedOrdersResult.growth = compareRejected
      getRejectedOrdersResult.growthInPercentage = (
         (Math.abs(compareRejected) / pastRejected) *
         100
      ).toFixed(2)
      result.getRejectedOrders = getRejectedOrdersResult

      //getSubscribedCustomers
      const getSubscribedCustomersResult = {}
      const presentSubscribedCustomers = present.getSubscribedCustomers[0].count
      const pastSubscribedCustomers = past.getSubscribedCustomers[0].count
      const compareSubscribedCustomers =
         presentSubscribedCustomers - pastSubscribedCustomers

      getSubscribedCustomersResult.isGrowth =
         compareSubscribedCustomers >= 0 ? true : false
      getSubscribedCustomersResult.growth = compareSubscribedCustomers
      getSubscribedCustomersResult.growthInPercentage = (
         (Math.abs(compareSubscribedCustomers) / pastSubscribedCustomers) *
         100
      ).toFixed(2)
      result.getSubscribedCustomers = getSubscribedCustomersResult

      //getRegisteredCustomers--onDemand
      const getRegisteredCustomersOnDemandResult = {}
      const presentRegisteredCustomersOnDemand =
         present.getRegisteredCustomers[0].onDemand
      const pastRegisteredCustomersOnDemand =
         past.getRegisteredCustomers[0].onDemand
      const compareRegisteredCustomersOnDemand =
         presentRegisteredCustomersOnDemand - pastRegisteredCustomersOnDemand

      getRegisteredCustomersOnDemandResult.isGrowth =
         compareRegisteredCustomersOnDemand >= 0 ? true : false
      getRegisteredCustomersOnDemandResult.growth =
         compareRegisteredCustomersOnDemand
      getRegisteredCustomersOnDemandResult.growthInPercentage = (
         (Math.abs(compareRegisteredCustomersOnDemand) /
            pastRegisteredCustomersOnDemand) *
         100
      ).toFixed(2)
      result.getRegisteredCustomersOnDemand =
         getRegisteredCustomersOnDemandResult

      //getRegisteredCustomers--subscription
      const getRegisteredCustomersSubscriptionResult = {}
      const presentRegisteredCustomersSubscription =
         present.getRegisteredCustomers[0].subscription
      const pastRegisteredCustomersSubscription =
         past.getRegisteredCustomers[0].subscription
      const compareRegisteredCustomersSubscription =
         presentRegisteredCustomersSubscription -
         pastRegisteredCustomersSubscription

      getRegisteredCustomersSubscriptionResult.isGrowth =
         compareRegisteredCustomersSubscription >= 0 ? true : false
      getRegisteredCustomersSubscriptionResult.growth =
         compareRegisteredCustomersSubscription
      getRegisteredCustomersSubscriptionResult.growthInPercentage = (
         (Math.abs(compareRegisteredCustomersSubscription) /
            pastRegisteredCustomersSubscription) *
         100
      ).toFixed(2)
      result.getRegisteredCustomersSubscription =
         getRegisteredCustomersSubscriptionResult

      //get registered customer
      const getRegisteredCustomersResult = {}
      const presentRegisteredCustomers =
         presentRegisteredCustomersOnDemand +
         presentRegisteredCustomersSubscription
      const pastRegisteredCustomers =
         pastRegisteredCustomersOnDemand + pastRegisteredCustomersSubscription
      const compareRegisteredCustomer =
         presentRegisteredCustomers - pastRegisteredCustomers

      getRegisteredCustomersResult.isGrowth =
         compareRegisteredCustomer >= 0 ? true : false
      getRegisteredCustomersResult.growth = compareRegisteredCustomer
      getRegisteredCustomersResult.growthInPercentage = (
         (Math.abs(compareRegisteredCustomer) / pastRegisteredCustomers) *
         100
      ).toFixed(2)
      result.getRegisteredCustomers = getRegisteredCustomersResult

      setCompare(prevState => ({ ...prevState, compareResult: result }))
   }
   if (brandLoading) {
      return <div>loading</div>
   }
   return (
      <>
         <Spacer size="10px" />
         <Tunnels tunnels={tunnels}>
            <Tunnel size="full" layer={1}>
               <TunnelHeader
                  title={tunnelTitle}
                  close={() => {
                     setTunnelTitle('')
                     closeTunnel(1)
                  }}
                  description="This is a Tunnel"
               />
               <TotalEarningTunnel
                  currency={currency[window._env_.REACT_APP_CURRENCY]}
               />
            </Tunnel>
            <Tunnel size="full" layer={2}>
               <TunnelHeader
                  title="Total Order Received"
                  close={() => {
                     closeTunnel(2)
                  }}
                  description="This is a Tunnel"
               />
               <TotalOrderRecTunnel
                  currency={currency[window._env_.REACT_APP_CURRENCY]}
               />
            </Tunnel>
         </Tunnels>
         <Tunnels tunnels={graphTunnels}>
            <Tunnel size="full" layer={1}>
               <TunnelHeader
                  title={graphTunnelData.title}
                  close={() => {
                     setGraphTunnelData({
                        title: undefined,
                        orderRefData: undefined,
                     })
                     closeGraphTunnel(1)
                  }}
                  description="This is a graph Tunnel"
               />
               <OrderRefTable
                  graphTunnelData={graphTunnelData}
                  groupBy={groupBy}
               />
            </Tunnel>
         </Tunnels>
         <Flex padding="0px 42px 0px 42px">
            <BrandAndShop
               brands={brands}
               setBrandShop={setBrandShop}
               setInsightSkip={setInsightSkip}
               brandShop={brandShop}
            />
            <Spacer size="10px" />
            <DateRangePicker
               from={from}
               to={to}
               setFrom={setFrom}
               setTo={setTo}
               compare={compare}
               setCompare={setCompare}
               setGroupBy={setGroupBy}
            />
            <Spacer size="10px" />
            {insights_analytics.length > 0 ? (
               <DashboardAnalyticsTiles
                  insights_analytics={insights_analytics[0]}
                  loading={subsLoading}
                  error={subsError}
                  groupBy={groupBy}
                  openTunnel={openTunnel}
                  setTunnelTitle={setTunnelTitle}
                  setGraphTunnelData={setGraphTunnelData}
                  openGraphTunnel={openGraphTunnel}
                  compare={compare}
                  from={from}
                  to={to}
               />
            ) : (
               <InlineLoader />
            )}
         </Flex>
      </>
   )
}
export default DashboardAnalytics
export const BrandAndShop = ({
   brands,
   setBrandShop,
   setInsightSkip,
   brandShop,
}) => {
   const [shopSource] = useState([
      {
         id: 1,
         title: 'All',
         payload: false,
      },
      {
         id: 2,
         title: 'Subscription',
         payload: 'subscription',
      },
      {
         id: 3,
         title: 'A-la-Carte',
         payload: 'a-la-carte',
      },
   ])
   const selectedOptionShop = option => {
      setBrandShop(prevState => ({ ...prevState, shopTitle: option.payload }))
      if (brandShop.brandId) {
         setInsightSkip(false)
      }
   }
   const selectedOptionBrand = option => {
      setBrandShop(prevState => ({ ...prevState, brandId: option.id }))
      if (brandShop.shopTitle) {
         setInsightSkip(false)
      }
   }
   const searchedOption = option => console.log(option)
   return (
      <Flex container flexDirection="row" width="40rem" alignItems="center">
         <Flex container flexDirection="column" width="30rem">
            <Text as="text1">Shop Type:</Text>
            <Spacer size="3px" />
            <Dropdown
               type="single"
               defaultValue={1}
               options={shopSource}
               searchedOption={searchedOption}
               selectedOption={selectedOptionShop}
               typeName="Shop"
            />
         </Flex>
         <Spacer size="20px" xAxis />
         <Flex container flexDirection="column" width="30rem">
            <Text as="text1">Brand:</Text>
            <Spacer size="3px" />
            <Dropdown
               type="single"
               options={brands}
               defaultOption={brandShop.brand}
               searchedOption={searchedOption}
               selectedOption={selectedOptionBrand}
               typeName="Brand"
            />
         </Flex>
      </Flex>
   )
}
export const DateRangePicker = ({
   setFrom,
   setTo,
   from,
   to,
   setGroupBy,
   setCompare,
   compare,
}) => {
   const [compareOptions, setCompareOptions] = useState(undefined)

   useEffect(() => {
      handleCompareClick()
   }, [from, to])

   //handle date change in datePicker
   const onChange = (dates, dateStrings) => {
      if (dates) {
         setFrom(dateStrings[0])
         setTo(dateStrings[1])
         // localStorage.setItem('analyticsDateFrom', dateStrings[0])
         // localStorage.setItem('analyticsDateTo', dateStrings[1])
      } else {
         setFrom(moment().format('YYYY-MM-DD'))
         setTo(moment().add(1, 'd').format('YYYY-MM-DD'))
      }
   }

   const handleCompareClick = () => {
      // this function will manage compare dropdown options according to date range
      /*
      option would be Last period, Last Week, Last Month, Last Year
      */
      const dateDifference = moment(to).diff(from, 'days')

      const toBeDropdownOptions = [
         {
            id: 1,
            title: 'Last Period',
            description: `${moment(from)
               .subtract(moment(to).diff(from, 'days') + 1, 'day')
               .format('ll')} to ${moment(from)
               .subtract(1, 'day')
               .format('ll')}`,
            payload: {
               from: moment(from)
                  .subtract(moment(to).diff(from, 'days') + 1, 'day')
                  .format('YYYY-MM-DD'),
               to: moment(from).subtract(1, 'day').format('YYYY-MM-DD'),
            },
         },
      ]

      if (dateDifference <= 7) {
         const newOption = {
            id: toBeDropdownOptions.length + 1,
            title: 'Last Week',
            description: `${moment(from)
               .subtract(1, 'week')
               .format('ll')} to ${moment(to)
               .subtract(1, 'week')
               .format('ll')}`,
            payload: {
               from: moment(from).subtract(1, 'week').format('YYYY-MM-DD'),
               to: moment(to).subtract(1, 'week').format('YYYY-MM-DD'),
            },
         }
         toBeDropdownOptions.push(newOption)
      }
      if (dateDifference <= 30) {
         const newOption = {
            id: toBeDropdownOptions.length + 1,
            title: 'Last Month',
            description: `${moment(from)
               .subtract(1, 'month')
               .format('ll')} to ${moment(to)
               .subtract(1, 'month')
               .format('ll')}`,
            payload: {
               from: moment(from).subtract(1, 'month').format('YYYY-MM-DD'),
               to: moment(to).subtract(1, 'month').format('YYYY-MM-DD'),
            },
         }
         toBeDropdownOptions.push(newOption)
      }
      if (dateDifference < 365) {
         const newOption = {
            id: toBeDropdownOptions.length + 1,
            title: 'Last Year',
            description: `${moment(from)
               .subtract(1, 'year')
               .format('ll')} to ${moment(to)
               .subtract(1, 'year')
               .format('ll')}`,
            payload: {
               from: moment(from).subtract(1, 'year').format('YYYY-MM-DD'),
               to: moment(to).subtract(1, 'year').format('YYYY-MM-DD'),
            },
         }
         toBeDropdownOptions.push(newOption)
      }
      setCompareOptions(toBeDropdownOptions)
   }

   const selectedOption = option => {
      setCompare(prevState => ({
         ...prevState,
         isSkip: false,
         from: option.payload.from,
         to: option.payload.to,
      }))
   }
   const searchedOption = option => console.log(option)
   return (
      <>
         <Flex container justifyContent="space-between" alignItems="center">
            <Flex container alignItems="center">
               <Space direction="vertical" size={12}>
                  <RangePicker
                     allowClear={false}
                     defaultValue={[
                        moment(from, 'YYYY-MM-DD'),
                        moment(to, 'YYYY-MM-DD'),
                     ]}
                     ranges={{
                        Today: [moment(), moment()],
                        'This Week': [moment().startOf('week'), moment()],
                        'Last Week': [
                           moment().subtract(1, 'week').startOf('week'),
                           moment().subtract(1, 'week').endOf('week'),
                        ],
                        'This Month': [
                           moment().startOf('month'),
                           moment().endOf('month'),
                        ],
                        'Last Month': [
                           moment().subtract(1, 'month').startOf('month'),
                           moment().subtract(1, 'month').endOf('month'),
                        ],
                        'This Year': [moment().startOf('year'), moment()],
                        'Last Year': [
                           moment().subtract(1, 'year').startOf('year'),
                           moment().subtract(1, 'year').endOf('year'),
                        ],
                        'All Time': [moment('2017-01-01'), moment()],
                     }}
                     onChange={onChange}
                  />
               </Space>
               <Spacer xAxis size="10px" />
               {!compare.isCompare && (
                  <ButtonGroup align="left">
                     <TextButton
                        type="ghost"
                        size="sm"
                        onClick={() => {
                           setCompare(prevState => ({
                              ...prevState,
                              isCompare: true,
                           }))
                           handleCompareClick()
                        }}
                     >
                        Compare
                     </TextButton>
                  </ButtonGroup>
               )}
               {compare.isCompare && (
                  <>
                     {compareOptions && (
                        <Flex container width="14rem">
                           <Dropdown
                              type="single"
                              options={compareOptions}
                              searchedOption={searchedOption}
                              selectedOption={selectedOption}
                              typeName="compare range"
                           />
                        </Flex>
                     )}
                     <ButtonGroup align="left">
                        <TextButton
                           type="ghost"
                           size="sm"
                           onClick={() => {
                              setCompare(prevState => ({
                                 ...prevState,
                                 isCompare: false,
                                 isSkip: true,
                              }))
                              setCompareOptions(undefined)
                           }}
                        >
                           Close
                        </TextButton>
                     </ButtonGroup>
                  </>
               )}
            </Flex>
            <Flex>
               <GroupByButtons from={from} to={to} setGroupBy={setGroupBy} />
            </Flex>
         </Flex>
      </>
   )
}

const DashboardAnalyticsTiles = ({
   insights_analytics,
   loading,
   error,
   groupBy,
   openTunnel,
   setTunnelTitle,
   compare,
   openGraphTunnel,
   setGraphTunnelData,
   from,
   to,
}) => {
   function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
   }
   const subCountHandler = keyName => {
      const growth = compare.compareResult[keyName]['growth']
      const isGrowth = compare.compareResult[keyName]['isGrowth']
      const growthInPercentage =
         compare.compareResult[keyName]['growthInPercentage']
      const toBeSubCount = growth
         ? isGrowth
            ? isFinite(growthInPercentage)
               ? '+' + growthInPercentage + '%'
               : '+100%'
            : '-' + growthInPercentage + '%'
         : '0.00%'

      const toBeSubCountColor = isGrowth ? '#26A69A' : '#F44336'
      return [toBeSubCount, toBeSubCountColor]
   }
   if (loading) {
      return <InlineLoader />
   }
   if (error) {
      logger(error)
      toast.error('Could not get the Insight data')
      return (
         <ErrorState height="320px" message="Could not get the Insight data" />
      )
   }

   return (
      <>
         <Tiles>
            <Tile>
               <Tile.Head title="Total Earning">
                  <Tile.Head.Actions>
                     <Tile.Head.Action
                        title="Expand"
                        onClick={() => {
                           setTunnelTitle('Total Earning')
                           openTunnel(1)
                        }}
                     >
                        <Expand />
                     </Tile.Head.Action>
                  </Tile.Head.Actions>
               </Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count
                        currency={currency[window._env_.REACT_APP_CURRENCY]}
                        subCount={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getTotalEarnings')[0]
                        }
                        subCountColor={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getTotalEarnings')[1]
                        }
                     >
                        {insights_analytics.getTotalEarnings[0]['total'] || 0}
                     </Tile.Count>
                  </Tile.Counts>
                  {insights_analytics.getTotalEarnings.length > 1 && (
                     <Tile.Chart>
                        <SparkChart
                           from={from}
                           to={to}
                           groupBy={groupBy}
                           dataOf="total"
                           insightAnalyticsData={insights_analytics.getTotalEarnings.slice(
                              1
                           )}
                           idName={['total_earning']}
                           compare={compare}
                           compareInsightAnalyticsData={
                              !compare.isSkip &&
                              compare.data &&
                              compare.data.getTotalEarnings.slice(1)
                           }
                           setGraphTunnelData={setGraphTunnelData}
                           openGraphTunnel={openGraphTunnel}
                           graphTunnelTitle="Total Earning"
                        />
                     </Tile.Chart>
                  )}
               </Tile.Body>
            </Tile>
            <Tile>
               <Tile.Head title="Order Recieved">
                  <Tile.Head.Actions>
                     <Tile.Head.Action
                        title="Expand"
                        onClick={() => {
                           openTunnel(2)
                        }}
                     >
                        <Expand />
                     </Tile.Head.Action>
                  </Tile.Head.Actions>
               </Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count
                        subCount={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getOrdersRecieved')[0]
                        }
                        subCountColor={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getOrdersRecieved')[1]
                        }
                     >
                        {
                           insights_analytics.getOrdersRecieved.find(
                              x => x.year === null
                           )['count']
                        }
                     </Tile.Count>
                  </Tile.Counts>
                  {insights_analytics.getOrdersRecieved.length > 1 && (
                     <Tile.Chart>
                        <SparkChart
                           from={from}
                           to={to}
                           groupBy={groupBy}
                           idName={['total_order_recieved']}
                           dataOf="count"
                           insightAnalyticsData={insights_analytics.getOrdersRecieved.filter(
                              x => x.year !== null
                           )}
                           compare={compare}
                           compareInsightAnalyticsData={
                              !compare.isSkip &&
                              compare.data &&
                              compare.data.getOrdersRecieved.filter(
                                 x => x.year !== null
                              )
                           }
                           setGraphTunnelData={setGraphTunnelData}
                           openGraphTunnel={openGraphTunnel}
                           graphTunnelTitle="Order Received"
                        />
                     </Tile.Chart>
                  )}
               </Tile.Body>
            </Tile>
            <Tile>
               <Tile.Head title="Total Accepted vs Rejected Orders"></Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count
                        subCount={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getAcceptedOrders')[0]
                        }
                        subCountColor={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getAcceptedOrders')[1]
                        }
                     >
                        {
                           insights_analytics.getAcceptedVsRejectedOrders
                              .acceptedCount
                        }
                     </Tile.Count>
                     <Tile.Count
                        subCount={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getRejectedOrders')[0]
                        }
                        subCountColor={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getRejectedOrders')[1]
                        }
                     >
                        {
                           insights_analytics.getAcceptedVsRejectedOrders
                              .rejectedCount
                        }
                     </Tile.Count>
                  </Tile.Counts>
               </Tile.Body>
            </Tile>
            <Tile>
               <Tile.Head title="Subscribed Customer">
                  {/* <Tile.Head.Actions>
                     <Tile.Head.Action
                        title="Expand"
                        onClick={() => {
                           // setTunnelTitle('Subscribed Customer')
                           // openTunnel(1)
                           console.log('Tunnel')
                        }}
                     >
                        <Expand />
                     </Tile.Head.Action>
                  </Tile.Head.Actions> */}
               </Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count
                        subCount={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getSubscribedCustomers')[0]
                        }
                        subCountColor={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getSubscribedCustomers')[1]
                        }
                     >
                        {insights_analytics.getSubscribedCustomers[0]['count']}
                     </Tile.Count>
                  </Tile.Counts>
                  {insights_analytics.getSubscribedCustomers.length > 1 && (
                     <Tile.Chart>
                        <SparkChart
                           from={from}
                           to={to}
                           groupBy={groupBy}
                           idName="subscribed_customers"
                           dataOf="total"
                           insightAnalyticsData={insights_analytics.getSubscribedCustomers.slice(
                              1
                           )}
                           compare={compare}
                           compareInsightAnalyticsData={
                              !compare.isSkip &&
                              compare.data &&
                              compare.data.getSubscribedCustomers.slice(1)
                           }
                           setGraphTunnelData={setGraphTunnelData}
                           openGraphTunnel={openGraphTunnel}
                           graphTunnelTitle="Subscribed Customer"
                        />
                     </Tile.Chart>
                  )}
               </Tile.Body>
            </Tile>
            <Tile>
               <Tile.Head title="Registered Customers"></Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count
                        subCount={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getRegisteredCustomers')[0]
                        }
                        subCountColor={
                           !compare.isSkip &&
                           compare.compareResult &&
                           subCountHandler('getRegisteredCustomers')[1]
                        }
                     >
                        {insights_analytics.getRegisteredCustomers[0][
                           'onDemand'
                        ] +
                           insights_analytics.getRegisteredCustomers[0][
                              'subscription'
                           ]}
                     </Tile.Count>
                  </Tile.Counts>
               </Tile.Body>
            </Tile>
         </Tiles>
      </>
   )
}

const SparkChart = ({
   insightAnalyticsData,
   from,
   to,
   dataOf,
   groupBy,
   compare,
   compareInsightAnalyticsData,
   setGraphTunnelData,
   openGraphTunnel,
   graphTunnelTitle,
}) => {
   const [dataForGraph, setDataForGraph] = useState(undefined)

   const CustomTooltip = ({ active, payload, label, groupBy, dataOf }) => {
      if (active && payload && payload.length) {
         return (
            <div
               style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f9f9f9',
                  width: '11rem',
                  height: 'auto',
                  margin: '2px 2px',
                  padding: '2px 2px',
                  boxShadow: '5px 5px 10px #888888',
               }}
            >
               {groupBy == 'hour' && (
                  <>
                     <Text as="text3">
                        {moment(payload[0]['payload']['present']).format(
                           'YYYY-MM-DD'
                        )}
                        {'  '}
                        {moment(payload[0]['payload']['present']).format('LT')}
                     </Text>
                     {!compare.isSkip && (
                        <Text as="text3">
                           {moment(payload[0]['payload']['past']).format(
                              'YYYY-MM-DD'
                           )}
                           {'  '}
                           {moment(payload[0]['payload']['past']).format('LT')}
                        </Text>
                     )}
                  </>
               )}
               {groupBy == 'day' && (
                  <>
                     <Text as="text3">
                        {moment(payload[0]['payload']['present']).format(
                           'YYYY-MM-DD'
                        )}
                     </Text>
                     {!compare.isSkip && (
                        <Text as="text3">
                           {moment(payload[0]['payload']['past']).format(
                              'YYYY-MM-DD'
                           )}
                        </Text>
                     )}
                  </>
               )}
               {groupBy == 'week' && (
                  <>
                     <Text as="text3">
                        {moment(payload[0]['payload']['present']).format('ll')}{' '}
                        {'- '}
                        {moment(payload[0]['payload']['present'])
                           .add(1, 'week')
                           .format('ll')}
                     </Text>
                     {!compare.isSkip && (
                        <Text as="text3">
                           {moment(payload[0]['payload']['past']).format('ll')}{' '}
                           {'- '}
                           {moment(payload[0]['payload']['past'])
                              .add(1, 'week')
                              .format('ll')}
                        </Text>
                     )}
                  </>
               )}
               {groupBy == 'month' && (
                  <>
                     <Text as="text3">
                        {moment(payload[0]['payload']['present']).format(
                           'MMM-YYYY'
                        )}
                     </Text>
                     {!compare.isSkip && (
                        <Text as="text3">
                           {moment(payload[0]['payload']['past']).format(
                              'MMM-YYYY'
                           )}
                        </Text>
                     )}
                  </>
               )}
               <Spacer size="3px" />
               <Text as="text3">{`${dataOf.toUpperCase()}: ${
                  payload[0].payload[dataOf]
               }`}</Text>
               {!compare.isSkip && (
                  <Text as="text3">{`${dataOf.toUpperCase()}: ${
                     payload[0].payload[dataOf + 'Compare']
                  }`}</Text>
               )}
            </div>
         )
      }

      return null
   }

   const dataGeneratorBetweenToDates = (from, to, groupBy) => {
      if (groupBy[groupBy.length - 1] == 'hour') {
         const hourBundler = (from, to, data, key1, key2, type) => {
            let hourBundle = []
            let startHourWithDate = from
            let uniqueId = 1
            //loop use to create a number of data (newBundle) per hour between 'from' to 'to' date
            while (startHourWithDate.diff(to, 'hours') <= 0) {
               //data in needed format
               let newBundle = {
                  [type]: moment(from).format(),
                  [key1]: 0,
                  [key2]: 0,
                  ['orderRefs' + type]: null,
                  uniqueId: uniqueId,
               }
               hourBundle.push(newBundle)
               startHourWithDate = startHourWithDate.add(1, 'hour')
               uniqueId++
            }

            /*create date in available data to easily differentiate when have same hour ex. 14 from 15-12-2020 and 14 from 14-11-2021*/
            const dataForHourWithDate = data.map(each => {
               let newDate = `${each.year}-${each.month}-${each.day}`
               each[type] = newDate
               return each
            })
            //merging process
            dataForHourWithDate.forEach(eachData => {
               //check, where available data's day and hour match
               const matchIndex = hourBundle.findIndex(eachHour => {
                  return (
                     moment(eachHour[type]).isSame(eachData[type], 'day') &&
                     moment(eachHour[type]).format('HH') == eachData.hour
                  )
               })
               //if match not found then matchIndex = -1 else...
               if (matchIndex >= 0) {
                  hourBundle[matchIndex][key1] = eachData.total
                  hourBundle[matchIndex][key2] = eachData.count
                  hourBundle[matchIndex]['orderRefs' + type] =
                     eachData.orderRefs
               }
            })
            return hourBundle
         }
         const hourBundlePresent = hourBundler(
            from,
            to,
            insightAnalyticsData,
            'count',
            'total',
            'present'
         )
         const hourBundlePast =
            !compare.isSkip &&
            compare.data &&
            hourBundler(
               moment(compare.from),
               moment(compare.to),
               compareInsightAnalyticsData,
               'countCompare',
               'totalCompare',
               'past'
            )
         if (!hourBundlePast) {
            setDataForGraph(hourBundlePresent)
            return
         } else {
            let merged = []
            for (let i = 0; i < hourBundlePresent.length; i++) {
               merged.push({
                  ...hourBundlePresent[i],
                  ...hourBundlePast[i],
               })
            }
            setDataForGraph(merged)
         }
         return
      } else if (groupBy[groupBy.length - 1] == 'day') {
         //key1 = count //key2=total
         const dayBundler = (from, to, data, key1, key2, type) => {
            let daysBundle = []
            let startDate = from
            let uniqueId = 1
            while (startDate.diff(to, 'days') <= 0) {
               const newBundle = {
                  [type]: moment(startDate).format(),
                  [key1]: 0,
                  [key2]: 0,
                  ['orderRefs' + type]: null,

                  uniqueId: uniqueId,
               }
               daysBundle.push(newBundle)
               startDate = startDate.add(1, 'day')
               uniqueId++
            }

            const dataWithDate = data.map(eachData => {
               let newDate = `${eachData.year}-${eachData.month}-${eachData.day}`
               eachData[type] = newDate
               return eachData
            })
            dataWithDate.forEach(eachData => {
               const matchIndex = daysBundle.findIndex(eachDay =>
                  moment(eachDay[type]).isSame(eachData[type])
               )
               if (matchIndex >= 0) {
                  daysBundle[matchIndex][key2] = eachData.total
                  daysBundle[matchIndex][key1] = eachData.count
                  daysBundle[matchIndex]['orderRefs' + type] =
                     eachData.orderRefs
               }
            })
            return daysBundle
         }
         const dayBundlePresent = dayBundler(
            from,
            to,
            insightAnalyticsData,
            'count',
            'total',
            'present'
         )
         const dayBundlePast =
            !compare.isSkip &&
            compare.data &&
            dayBundler(
               moment(compare.from),
               moment(compare.to),
               compareInsightAnalyticsData,
               'countCompare',
               'totalCompare',
               'past'
            )

         if (!dayBundlePast) {
            setDataForGraph(dayBundlePresent)
            return
         } else {
            let merged = []
            for (let i = 0; i < dayBundlePresent.length; i++) {
               merged.push({
                  ...dayBundlePresent[i],
                  ...dayBundlePast[i],
               })
            }
            setDataForGraph(merged)
         }
         return
      } else if (groupBy[groupBy.length - 1] == 'week') {
         //key1 = count key2 = total
         const weekBundler = (from, to, data, key1, key2, type) => {
            let weekBundle = []
            let startWeek = from
            let uniqueId = 1
            while (startWeek.diff(to, 'weeks') <= 0) {
               const newBundle = {
                  [type]: moment(startWeek).format(),
                  [key1]: 0,
                  [key2]: 0,
                  ['orderRefs' + type]: null,
                  weekNumber: moment(startWeek).format('WW'),
                  uniqueId: uniqueId,
               }
               weekBundle.push(newBundle)
               startWeek = startWeek.add(1, 'week').startOf('isoWeek')
               uniqueId++
            }
            data.forEach(eachData => {
               const matchIndex = weekBundle.findIndex(
                  eachWeek =>
                     moment(eachWeek[type]).format('YYYY') == eachData.year &&
                     eachWeek.weekNumber == eachData.week
               )
               if (matchIndex >= 0) {
                  weekBundle[matchIndex][key1] = eachData.count
                  weekBundle[matchIndex][key2] = eachData.total
                  weekBundle[matchIndex]['orderRefs' + type] =
                     eachData.orderRefs
               }
            })
            return weekBundle
         }
         const weekBundlePresent = weekBundler(
            from,
            to,
            insightAnalyticsData,
            'count',
            'total',
            'present'
         )
         const weekBundlePast =
            !compare.isSkip &&
            compare.data &&
            weekBundler(
               moment(compare.from),
               moment(compare.to),
               compareInsightAnalyticsData,
               'countCompare',
               'totalCompare',
               'past'
            )

         if (!weekBundlePast) {
            setDataForGraph(weekBundlePresent)
            return
         } else {
            let merged = []
            for (let i = 0; i < weekBundlePresent.length; i++) {
               merged.push({
                  ...weekBundlePresent[i],
                  ...weekBundlePast[i],
               })
            }
            setDataForGraph(merged)
         }
         return
      } else {
         //key1 = count key2 = total
         const monthBundler = (from, to, data, key1, key2, type) => {
            let monthsBundle = []
            let startMonth = from
            let uniqueId = 1
            //create an array for group with year, month with data count and total call monthBundle
            while (startMonth.diff(to, 'months') <= 0) {
               const newBundle = {
                  [type]: moment(startMonth).format(),
                  [key1]: 0,
                  [key2]: 0,
                  ['orderRefs' + type]: null,

                  uniqueId: uniqueId,
               }
               monthsBundle.push(newBundle)
               startMonth = startMonth.add(1, 'month')
               uniqueId++
            }

            //in a monthBundle change to month data which has some value by dataForMonths
            data.forEach(eachData => {
               const matchIndex = monthsBundle.findIndex(
                  eachMonth =>
                     moment(eachMonth[type]).isSame(eachData[type], 'year') &&
                     moment(eachMonth[type]).format('MM') == eachData.month
               )
               if (matchIndex >= 0) {
                  monthsBundle[matchIndex][key1] = eachData.count
                  monthsBundle[matchIndex][key2] = eachData.total
                  monthsBundle[matchIndex]['orderRefs' + type] =
                     eachData.orderRefs
               }
            })
            return monthsBundle
         }
         const monthBundlePresent = monthBundler(
            from,
            to,
            insightAnalyticsData,
            'count',
            'total',
            'present'
         )
         const monthBundlePast =
            !compare.isSkip &&
            compare.data &&
            monthBundler(
               moment(compare.from),
               moment(compare.to),
               compareInsightAnalyticsData,
               'countCompare',
               'totalCompare',
               'past'
            )
         if (!monthBundlePast) {
            setDataForGraph(monthBundlePresent)
            return
         } else {
            let merged = []
            for (let i = 0; i < monthBundlePresent.length; i++) {
               merged.push({
                  ...monthBundlePresent[i],
                  ...monthBundlePast[i],
               })
            }
            setDataForGraph(merged)
         }
         // set this monthsBundle value after change available data
         return
      }
   }

   useEffect(() => {
      if (compare.isSkip) {
         dataGeneratorBetweenToDates(moment(from), moment(to), groupBy)
      } else {
         if (compare.data) {
            dataGeneratorBetweenToDates(moment(from), moment(to), groupBy)
         }
      }
   }, [from, to, groupBy, compare])
   return (
      <>
         <AreaChart
            width={300}
            height={200}
            data={dataForGraph}
            margin={{
               top: 10,
               right: 30,
               left: 0,
               bottom: 0,
            }}
         >
            <XAxis dataKey="uniqueId" hide={true}></XAxis>
            <YAxis hide={true} />
            <Tooltip
               content={
                  <CustomTooltip
                     groupBy={groupBy[groupBy.length - 1]}
                     dataOf={dataOf}
                  />
               }
            />
            <Area
               type="monotone"
               dataKey={dataOf}
               stroke="#8884d8"
               fill="#8884d8"
               activeDot={{
                  onClick: (event, payload) => {
                     if (
                        payload.payload.orderRefspresent ||
                        payload.payload.orderRefspast
                     ) {
                        setGraphTunnelData(prevState => ({
                           ...prevState,
                           title: graphTunnelTitle,
                           orderRefData: [
                              payload.payload.orderRefspresent,
                              payload.payload.orderRefspast,
                           ],
                           presentTime: payload.payload.present,
                           pastTime: payload.payload.past,
                        }))
                        openGraphTunnel(1)
                     }
                  },
                  cursor: 'pointer',
               }}
            />
            {!compare.isSkip && compare.data && (
               <Area
                  type="monotone"
                  dataKey={dataOf + 'Compare'}
                  stroke="#C9D8B6"
                  fill="#C9D8B6"
                  activeDot={{
                     onClick: (event, payload) => {
                        if (
                           payload.payload.orderRefspresent ||
                           payload.payload.orderRefspast
                        ) {
                           setGraphTunnelData(prevState => ({
                              ...prevState,
                              title: graphTunnelTitle,
                              orderRefData: [
                                 payload.payload.orderRefspresent,
                                 payload.payload.orderRefspast,
                              ],
                              presentTime: payload.payload.present,
                              pastTime: payload.payload.past,
                           }))
                           openGraphTunnel(1)
                        }
                     },
                     cursor: 'pointer',
                  }}
               />
            )}
         </AreaChart>
         <Flex
            container
            flexDirection="row"
            width="100%"
            justifyContent="space-between"
            padding="4px 4px"
         >
            <Text as="helpText">
               {from ? moment(from).format('MMM Do YY') : 'Starting'}
            </Text>
            <Text as="helpText">
               {to
                  ? moment(to).format('MMM Do YY')
                  : moment().format('MMM Do YY')}
            </Text>
         </Flex>
      </>
   )
}

const GroupByButtons = ({ from, to, setGroupBy }) => {
   const [options, setOptions] = React.useState(null)

   const buttonMagic = () => {
      if (moment(to).diff(from, 'days') <= 7) {
         setGroupBy(['year', 'month', 'week', 'day', 'hour'])
         return setOptions([
            {
               id: 1,
               title: 'Hour',
            },
            {
               id: 2,
               title: 'Day',
            },
         ])
      } else if (
         moment(to).diff(from, 'days') > 7 &&
         moment(to).diff(from, 'days') <= 28
      ) {
         setGroupBy(['year', 'month', 'week', 'day'])

         return setOptions([
            {
               id: 1,
               title: 'Day',
            },
            {
               id: 2,
               title: 'Week',
            },
         ])
      } else if (
         moment(to).diff(from, 'days') > 28 &&
         moment(to).diff(from, 'days') <= 365
      ) {
         setGroupBy(['year', 'month', 'week'])
         return setOptions([
            {
               id: 1,
               title: 'Week',
            },
            {
               id: 2,
               title: 'Month',
            },
         ])
      } else {
         setGroupBy(['year', 'month'])
         return setOptions([
            {
               id: 1,
               title: 'Week',
            },
            {
               id: 2,
               title: 'Month',
            },
         ])
      }
   }
   useEffect(() => {
      buttonMagic()
   }, [from, to])
   const handleOnChangeRadio = option => {
      if (option == null) {
         setGroupBy(options.map(x => x.title))
      } else {
         if (option.title == 'Hour') {
            return setGroupBy(['year', 'month', 'week', 'day', 'hour'])
         } else if (option.title == 'Day') {
            return setGroupBy(['year', 'month', 'week', 'day'])
         } else if (option.title == 'Week') {
            return setGroupBy(['year', 'month', 'week'])
         } else {
            return setGroupBy(['year', 'month'])
         }
      }
   }
   if (options == null) {
      return <InlineLoader />
   }
   return (
      <>
         <RadioGroup
            options={options}
            active={1}
            onChange={option => handleOnChangeRadio(option)}
         />
      </>
   )
}

const TunnelBody = styled.div`
   padding: 10px 16px 0px 32px;
   height: calc(100% - 103px);
   overflow: auto;
`
