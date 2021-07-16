import { useSubscription } from '@apollo/react-hooks'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import './style.css'
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
const { RangePicker } = DatePicker

//currencies
const currency = {
   USD: '$',
   INR: '₹',
   EUR: '€',
}

const DashboardAnalytics = () => {
   const [from, setFrom] = useState(moment().format('YYYY-MM-DD'))
   const [to, setTo] = useState(moment().add(1, 'd').format('YYYY-MM-DD'))
   const [compare, setCompare] = useState({
      isCompare: false,
      data: null,
      isRun: false,
      from: from,
      to: to,
      compareResult: null,
   })
   const [groupBy, setGroupBy] = useState([
      'year',
      'month',
      'week',
      'day',
      'hour',
   ])
   const [tunnels, openTunnel, closeTunnel] = useTunnel(1)
   const [tunnelTitle, setTunnelTitle] = useState('')

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
               } AND a."brandId" = 1 AND b.source = \'subscription\'`,
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
               } a."brandId" = 1 AND b.source = 'subscription'`,
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
               } a."brandId" = 1 AND b.source = 'subscription'`,
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
               } AND a."brandId" = 1 AND b.source = \'subscription\'`,
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
               } a."brandId" = 1 AND b.source = 'subscription'`,
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
               } AND a.\"brandId\" = 1 AND b.\"source\" = 'subscription'`,
               groupingSets: `(${groupBy.toString()})`,
               columns: groupBy
                  .map(group => {
                     return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
                  })
                  .join(','),
            },
         },
      },
   })
   // subscription for for compare data
   useSubscription(INSIGHT_ANALYTICS, {
      variables: {
         args: {
            params: {
               // where: `\"isAccepted\" = true AND COALESCE(\"isRejected\", false) = false AND \"paymentStatus\" = 'SUCCEEDED'  AND a.\"brandId\" = 1 AND b.source = 'subscription'`,
               // groupingSets: `(${groupBy.toString()})`,
               // columns: groupBy
               //    .map(group => {
               //       return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
               //    })
               //    .join(','),
               where: '"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' AND a."brandId" = 1 AND b.source = \'subscription\'',
               groupingSets: '(year, month)',
               columns:
                  'EXTRACT(YEAR FROM a.created_at) AS "year",EXTRACT(MONTH FROM a.created_at) AS "month"',
            },
         },
         args1: {
            params: {
               // where: `\"isAccepted\" = true AND COALESCE(\"isRejected\", false) = false AND \"paymentStatus\" = 'SUCCEEDED'  AND a.\"brandId\" = 1 AND b.source = 'subscription'`,
               // groupingSets: `(${groupBy.toString()})`,
               // columns: groupBy
               //    .map(group => {
               //       return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
               //    })
               //    .join(','),
               where: '"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' AND a."brandId" = 1 AND b.source = \'subscription\'',
               groupingSets: '(year, month)',
               columns:
                  'EXTRACT(YEAR FROM a.created_at) AS "year",EXTRACT(MONTH FROM a.created_at) AS "month"',
            },
         },
         args2: {
            params: {
               // where: `\"isAccepted\" = true AND COALESCE(\"isRejected\", false) = false AND \"paymentStatus\" = 'SUCCEEDED'  AND a.\"brandId\" = 1 AND b.source = 'subscription'`,
               // groupingSets: `(${groupBy.toString()})`,
               // columns: groupBy
               //    .map(group => {
               //       return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
               //    })
               //    .join(','),
               where: '"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' AND a."brandId" = 1 AND b.source = \'subscription\'',
               groupingSets: '(year, month)',
               columns:
                  'EXTRACT(YEAR FROM a.created_at) AS "year",EXTRACT(MONTH FROM a.created_at) AS "month"',
            },
         },
         args3: {
            params: {
               // where: `\"isAccepted\" = true AND COALESCE(\"isRejected\", false) = false AND \"paymentStatus\" = 'SUCCEEDED'  AND a.\"brandId\" = 1 AND b.source = 'subscription'`,
               // groupingSets: `(${groupBy.toString()})`,
               // columns: groupBy
               //    .map(group => {
               //       return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
               //    })
               //    .join(','),
               where: '"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' AND a."brandId" = 1 AND b.source = \'subscription\'',
               groupingSets: '(year, month)',
               columns:
                  'EXTRACT(YEAR FROM a.created_at) AS "year",EXTRACT(MONTH FROM a.created_at) AS "month"',
            },
         },
         args4: {
            params: {
               // where: `\"isAccepted\" = true AND COALESCE(\"isRejected\", false) = false AND \"paymentStatus\" = 'SUCCEEDED'  AND a.\"brandId\" = 1 AND b.source = 'subscription'`,
               // groupingSets: `(${groupBy.toString()})`,
               // columns: groupBy
               //    .map(group => {
               //       return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
               //    })
               //    .join(','),
               where: '"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' AND a."brandId" = 1 AND b.source = \'subscription\'',
               groupingSets: '(year, month)',
               columns:
                  'EXTRACT(YEAR FROM a.created_at) AS "year",EXTRACT(MONTH FROM a.created_at) AS "month"',
            },
         },
         args5: {
            params: {
               // where: `\"isAccepted\" = true AND COALESCE(\"isRejected\", false) = false AND \"paymentStatus\" = 'SUCCEEDED'  AND a.\"brandId\" = 1 AND b.source = 'subscription'`,
               // groupingSets: `(${groupBy.toString()})`,
               // columns: groupBy
               //    .map(group => {
               //       return `EXTRACT(${group.toUpperCase()} FROM a.created_at) AS \"${group.toLowerCase()}\"`
               //    })
               //    .join(','),
               where: '"isAccepted" = true AND COALESCE("isRejected", false) = false AND "paymentStatus" = \'SUCCEEDED\' AND a."brandId" = 1 AND b.source = \'subscription\'',
               groupingSets: '(year, month)',
               columns:
                  'EXTRACT(YEAR FROM a.created_at) AS "year",EXTRACT(MONTH FROM a.created_at) AS "month"',
            },
         },
      },
      skip: true,
      onSubscriptionData: ({ subscriptionData }) => {
         setCompare(prevState => ({
            ...prevState,
            data: subscriptionData.data.insights_analytics[0],
         }))
      },
   })
   console.log('analytics', insights_analytics)
   console.log('this is subError', subsError)
   const run = () => {
      if (insights_analytics && compare.data) {
         const presentData = insights_analytics[0]
         const pastData = compare.data
         const compareMachine = (key, keyChild) => {}
         const keysInData = Object.keys(insights_analytics).filter(
            key => key !== 'id'
         )
         //          keysInData.forEach((each)=>{
         // compareMachine(each,)
         //          })
      }
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
               <DrillDown />
            </Tunnel>
         </Tunnels>
         <Flex padding="0px 42px 0px 42px">
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
            <DashboardAnalyticsTiles
               insights_analytics={insights_analytics[0]}
               loading={subsLoading}
               error={subsError}
               groupBy={groupBy}
               openTunnel={openTunnel}
               setTunnelTitle={setTunnelTitle}
               from={from}
               to={to}
            />
         </Flex>
      </>
   )
}
export default DashboardAnalytics

const DateRangePicker = ({
   setFrom,
   setTo,
   from,
   to,
   setGroupBy,
   setCompare,
   compare,
}) => {
   const onChange = (dates, dateStrings) => {
      if (dates) {
         setFrom(dateStrings[0])
         setTo(dateStrings[1])
      } else {
         setFrom(moment().format('YYYY-MM-DD'))
         setTo(moment().add(1, 'd').format('YYYY-MM-DD'))
      }
   }
   const onChangeCompare = (dates, dateStrings) => {
      console.log(dates, dateStrings)
      if (dates) {
         setCompare(prevState => ({
            ...prevState,
            from: dateStrings[0],
            to: dateStrings[1],
         }))
      } else {
         setCompare(prevState => ({
            ...prevState,
            from: moment().format('YYYY-MM-DD'),
            to: moment().add(1, 'd').format('YYYY-MM-DD'),
         }))
      }
   }
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
                        onClick={() =>
                           setCompare(prevState => ({
                              ...prevState,
                              isCompare: true,
                           }))
                        }
                     >
                        Compare
                     </TextButton>
                  </ButtonGroup>
               )}
               {compare.isCompare && (
                  <>
                     <Spacer xAxis size="10px" />
                     <ButtonGroup align="left">
                        <TextButton type="solid" size="sm">
                           Run
                        </TextButton>
                        <TextButton
                           type="ghost"
                           size="sm"
                           onClick={() =>
                              setCompare(prevState => ({
                                 ...prevState,
                                 isCompare: false,
                              }))
                           }
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
   from,
   to,
}) => {
   function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
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
                           // setTunnelTitle('Total Earning')
                           // openTunnel(1)
                           console.log('Tunnel')
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
                           // setTunnelTitle('Order Received')
                           // openTunnel(1)
                           console.log('Tunnel')
                        }}
                     >
                        <Expand />
                     </Tile.Head.Action>
                  </Tile.Head.Actions>
               </Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count>
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
                        />
                     </Tile.Chart>
                  )}
               </Tile.Body>
            </Tile>
            <Tile>
               <Tile.Head title="Total Accepted vs Rejected Orders"></Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count>
                        {
                           insights_analytics.getAcceptedVsRejectedOrders
                              .acceptedCount
                        }
                     </Tile.Count>
                     <Tile.Count>
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
                  <Tile.Head.Actions>
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
                  </Tile.Head.Actions>
               </Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count>
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
                        />
                     </Tile.Chart>
                  )}
               </Tile.Body>
            </Tile>
            <Tile>
               <Tile.Head title="Registered Customers"></Tile.Head>
               <Tile.Body>
                  <Tile.Counts>
                     <Tile.Count>
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

const SparkChart = ({ insightAnalyticsData, from, to, dataOf, groupBy }) => {
   console.log('analytics data', insightAnalyticsData)
   const [dataForGraph, setDataForGraph] = useState(undefined)

   const CustomTooltip = ({ active, payload, label, groupBy, dataOf }) => {
      console.log('Hello')
      if (active && payload && payload.length) {
         return (
            <div
               style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f9f9f9',
                  width: '11rem',
                  height: '3rem',
                  margin: '2px 2px',
                  padding: '2px 2px',
                  boxShadow: '5px 5px 10px #888888',
               }}
            >
               {groupBy == 'hour' && (
                  <Text as="text3">
                     {moment(label).format('YYYY-MM-DD')}
                     {'  '}
                     {moment(label).format('LT')}
                  </Text>
               )}
               {groupBy == 'day' && (
                  <Text as="text3">{moment(label).format('YYYY-MM-DD')}</Text>
               )}
               {groupBy == 'week' && (
                  <Text as="text3">
                     {moment(label).format('ll')} {'- '}
                     {moment(label).add(1, 'week').format('ll')}
                  </Text>
               )}
               {groupBy == 'month' && (
                  <Text as="text3">{moment(label).format('MMM-YYYY')}</Text>
               )}
               <Spacer size="3px" />
               <Text as="text3">{`${dataOf.toUpperCase()}: ${
                  payload[0].payload[dataOf]
               }`}</Text>
            </div>
         )
      }

      return null
   }

   const dataGeneratorBetweenToDates = (from, to, groupBy) => {
      if (groupBy[groupBy.length - 1] == 'hour') {
         let hourBundle = []
         let startHourWithDate = from

         //loop use to create a number of data (newBundle) per hour between 'from' to 'to' date
         while (startHourWithDate.diff(to, 'hours') <= 0) {
            //data in needed format
            let newBundle = {
               xAxis: moment(from).format(),
               count: 0,
               total: 0,
            }
            hourBundle.push(newBundle)
            startHourWithDate = startHourWithDate.add(1, 'hour')
         }

         /*create date in available data to easily differentiate when have same hour ex. 14 from 15-12-2020 and 14 from 14-11-2021*/
         const dataForHourWithData = insightAnalyticsData.map(each => {
            let newDate = `${each.year}-${each.month}-${each.day}`
            each.xAxis = newDate
            return each
         })

         //merging process
         dataForHourWithData.forEach(eachData => {
            //check, where available data's day and hour match
            const matchIndex = hourBundle.findIndex(eachHour => {
               return (
                  moment(eachHour.xAxis).isSame(eachData.xAxis, 'day') &&
                  moment(eachHour.xAxis).format('HH') == eachData.hour
               )
            })
            //if match not found then matchIndex = -1 else...
            if (matchIndex >= 0) {
               hourBundle[matchIndex]['total'] = eachData.total
               hourBundle[matchIndex]['count'] = eachData.count
            }
         })
         setDataForGraph(hourBundle)
         return
      } else if (groupBy[groupBy.length - 1] == 'day') {
         let daysBundle = []
         let startDate = from
         while (startDate.diff(to, 'days') <= 0) {
            const newBundle = {
               xAxis: moment(startDate).format(),
               count: 0,
               total: 0,
            }
            daysBundle.push(newBundle)
            startDate = startDate.add(1, 'day')
         }

         const dataWithDate = insightAnalyticsData.map(eachData => {
            let newDate = `${eachData.year}-${eachData.month}-${eachData.day}`
            eachData.xAxis = newDate
            return eachData
         })

         dataWithDate.forEach(eachData => {
            const matchIndex = daysBundle.findIndex(eachDay =>
               moment(eachDay.xAxis).isSame(eachData.xAxis)
            )
            if (matchIndex >= 0) {
               daysBundle[matchIndex]['total'] = eachData.total
               daysBundle[matchIndex]['count'] = eachData.count
            }
         })

         setDataForGraph(daysBundle)
         return
      } else if (groupBy[groupBy.length - 1] == 'week') {
         let weekBundle = []
         let startWeek = from
         while (startWeek.diff(to, 'weeks') <= 0) {
            const newBundle = {
               xAxis: moment(startWeek).format(),
               count: 0,
               total: 0,
            }
            weekBundle.push(newBundle)
            startWeek = startWeek.add(1, 'week')
         }
         insightAnalyticsData.forEach(eachData => {
            const matchIndex = weekBundle.findIndex(
               eachWeek =>
                  moment(eachWeek.xAxis).format('YYYY') == eachData.year &&
                  moment(eachWeek.xAxis).format('WW') == eachData.week
            )
            if (matchIndex >= 0) {
               weekBundle[matchIndex]['total'] = eachData.total
               weekBundle[matchIndex]['count'] = eachData.count
            }
         })
         setDataForGraph(weekBundle)
         return
      } else {
         let monthsBundle = []
         let startMonth = from

         //create an array for group with year, month with data count and total call monthBundle
         while (startMonth.diff(to, 'months') <= 0) {
            const newBundle = {
               xAxis: moment(startMonth).format(),
               count: 0,
               total: 0,
            }
            monthsBundle.push(newBundle)
            startMonth = startMonth.add(1, 'month')
         }

         //in a monthBundle change to month data which has some value by dataForMonths
         insightAnalyticsData.forEach(eachData => {
            const matchIndex = monthsBundle.findIndex(
               eachMonth =>
                  moment(eachMonth.xAxis).isSame(eachData.xAxis, 'year') &&
                  moment(eachMonth.xAxis).format('MM') == eachData.month
            )
            if (matchIndex >= 0) {
               monthsBundle[matchIndex]['total'] = eachData.total
               monthsBundle[matchIndex]['count'] = eachData.count
            }
         })

         // set this monthsBundle value after change available data
         setDataForGraph(monthsBundle)
         return
      }
   }

   useEffect(() => {
      dataGeneratorBetweenToDates(moment(from), moment(to), groupBy)
   }, [from, to, groupBy])
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
            <XAxis dataKey="xAxis" hide={true}></XAxis>
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
            />
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
      console.log('Radio button option', option)
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

const DrillDown = () => {
   const [from, setFrom] = useState()
   const [to, setTo] = useState()
   const [groupBy, setGroupBy] = useState(['day', 'hour'])

   return (
      <TunnelBody>
         <DateRangePicker
            from={from}
            setFrom={setFrom}
            to={to}
            setTo={setTo}
            setGroupBy={setGroupBy}
         />
      </TunnelBody>
   )
}

const TunnelBody = styled.div`
   padding: 32px 16px 0px 32px;
   height: calc(100% - 103px);
   overflow: auto;
`
