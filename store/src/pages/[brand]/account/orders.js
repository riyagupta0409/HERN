import React from 'react'
import { useRouter } from 'next/router'
import tw, { styled, css } from 'twin.macro'
import { useSubscription } from '@apollo/react-hooks'

import { graphQLClient, useConfig } from '../../../lib'
import { useUser } from '../../../context'
import { formatDate, getRoute, getSettings, isClient } from '../../../utils'
import {
   ORDER_HISTORY,
   ORDER,
   NAVIGATION_MENU,
   WEBSITE_PAGE,
} from '../../../graphql'
import {
   SEO,
   Layout,
   HelperBar,
   ProfileSidebar,
   ProductSkeleton,
} from '../../../components'
import OrderInfo from '../../../sections/OrderInfo'
import { route } from 'next/dist/next-server/server/router'

const Orders = props => {
   const router = useRouter()
   const { isAuthenticated, isLoading } = useUser()
   const { seo, settings, navigationMenus } = props
   React.useEffect(() => {
      if (!isAuthenticated && !isLoading) {
         isClient && localStorage.setItem('landed_on', location.href)
         router.push(getRoute('/get-started/register'))
      }
   }, [isAuthenticated, isLoading])
   return (
      <Layout settings={settings} navigationMenus={navigationMenus}>
         <SEO title="Order History" />
         <Main>
            <ProfileSidebar />
            <OrderHistory />
         </Main>
      </Layout>
   )
}

export default Orders

const OrderHistory = () => {
   return (
      <Wrapper>
         <Listing />
         <Details />
      </Wrapper>
   )
}

const Listing = () => {
   const router = useRouter()
   const { user } = useUser()
   const { configOf } = useConfig()
   const [orderWindow, setOrderWindow] = React.useState(1)
   const { loading, data: { orders = {} } = {} } = useSubscription(
      ORDER_HISTORY,
      {
         variables: {
            keycloakId: { _eq: user?.keycloakId },
         },
         onSubscriptionData: ({
            subscriptionData: { data: { orders = {} } = {} } = {},
         }) => {
            if (orders.aggregate.count > 0) {
               const queryId = new URL(location.href).searchParams.get('id')
               if (!queryId) {
                  const [node] = orders.nodes
                  router.push(
                     getRoute(`/account/orders?id=${node.occurenceId}`)
                  )
               }
            }
         },
      }
   )
   const theme = configOf('theme-color', 'Visual')

   const selectOrder = id => {
      router.push(getRoute(`/account/orders?id=${id}`))
   }

   if (loading)
      return (
         <aside tw="border-r overflow-y-auto">
            <h2 tw="px-3 pt-3 pb-1 mb-2 text-green-600 text-2xl">Orders</h2>
            <ul tw="px-2 space-y-2">
               <li tw="bg-gray-300 px-2 h-10 rounded"></li>
               <li tw="bg-gray-200 px-2 h-10 rounded"></li>
               <li tw="bg-gray-100 px-2 h-10 rounded"></li>
            </ul>
         </aside>
      )
   return (
      <aside tw="border-r overflow-y-auto">
         <Title theme={theme}>Orders</Title>
         <ul tw="px-2 space-y-2">
            {orders.nodes.map(
               (node, i) =>
                  (i + 1 <= orderWindow ||
                     (isClient && window.innerWidth > 786)) && (
                     <Date
                        theme={theme}
                        key={node.occurrenceId}
                        onClick={() => selectOrder(node.occurenceId)}
                        className={`${
                           node.occurenceId === Number(router.query.id)
                              ? 'active'
                              : ''
                        }`}
                     >
                        {formatDate(node.occurence.date, {
                           month: 'short',
                           day: 'numeric',
                           year: 'numeric',
                        })}
                     </Date>
                  )
            )}
            {orders.nodes.length > orderWindow && (
               <div
                  tw="float-right text-sm text-blue-500 block md:hidden"
                  onClick={() => setOrderWindow(orderWindow + 4)}
               >
                  View More
               </div>
            )}
         </ul>
      </aside>
   )
}

const Details = () => {
   const router = useRouter()
   const { user } = useUser()
   const { configOf } = useConfig()
   const {
      error,
      loading,
      data: { order = {} } = {},
   } = useSubscription(ORDER, {
      skip: !user?.keycloakId || !user?.brandCustomerId || !router.query.id,
      variables: {
         keycloakId: user?.keycloakId,
         subscriptionOccurenceId: router.query.id,
         brand_customerId: user?.brandCustomerId,
      },
   })
   if (!loading && error) {
      console.log(error)
   }

   const paymentMethod = user?.platform_customer?.paymentMethods.find(
      node => node.stripePaymentMethodId === order?.cart?.paymentMethodId
   )
   const theme = configOf('theme-color', 'Visual')

   if (loading)
      return (
         <main tw="mx-3">
            <h2 tw="pt-3 pb-1 mb-2 text-green-600 text-2xl">Order Details</h2>
            <ProductCards>
               <ProductSkeleton />
               <ProductSkeleton />
            </ProductCards>
         </main>
      )
   if (!router.query.id)
      return (
         <div tw="m-3">
            <HelperBar type="warning">
               <HelperBar.SubTitle>
                  Select a date to view an order details
               </HelperBar.SubTitle>
            </HelperBar>
         </div>
      )
   return (
      <main tw="mx-3">
         <header tw="flex items-center justify-between">
            <Title theme={theme}>Order Details</Title>
            {order?.cart?.orderStatus?.title && (
               <Status status={order?.cart?.orderStatus?.title}>
                  {order?.cart?.orderStatus?.title}
               </Status>
            )}
         </header>
         <OrderInfo cart={order?.cart} />
         <h4 tw="text-lg text-gray-700 my-4 pb-1 border-b">Payment</h4>
         {order?.cart?.paymentStatus !== 'SUCCEEDED' && (
            <button
               onClick={() => route.push(`/checkout?id=${order?.cart?.id}`)}
               tw="rounded py-2 bg-red-500 text-white px-6 uppercase tracking-wider mb-3"
            >
               Complete Payment
            </button>
         )}
         <section tw="mb-3 p-2 border w-full">
            {paymentMethod ? (
               <>
                  <div tw="rounded flex items-center justify-between">
                     <span tw="text-xl">{paymentMethod?.cardHolderName}</span>
                     <div tw="flex items-center">
                        <span tw="font-medium">{paymentMethod?.expMonth}</span>
                        &nbsp;/&nbsp;
                        <span tw="font-medium">{paymentMethod?.expYear}</span>
                     </div>
                  </div>
                  <span>
                     <span tw="text-gray-500">Last 4:</span>{' '}
                     {paymentMethod?.last4}
                  </span>
               </>
            ) : (
               <p>Payment method linked to this order has been deleted.</p>
            )}
         </section>
      </main>
   )
}

export const getStaticProps = async ({ params }) => {
   const client = await graphQLClient()
   const dataByRoute = await client.request(WEBSITE_PAGE, {
      domain: params.brand,
      route: '/account/orders',
   })
   // const domain =
   //    process.env.NODE_ENV === 'production'
   //       ? params.domain
   //       : 'test.dailykit.org'
   const domain = 'test.dailykit.org'
   const { seo, settings } = await getSettings(domain, '/account/orders')
   //navigation menu
   const navigationMenu = await client.request(NAVIGATION_MENU, {
      navigationMenuId:
         dataByRoute.website_websitePage[0]['website']['navigationMenuId'],
   })
   const navigationMenus = navigationMenu.website_navigationMenuItem
   return {
      props: {
         seo,
         settings,
         navigationMenus,
      },
      revalidate: 1,
   }
}
export async function getStaticPaths() {
   return {
      paths: [],
      fallback: 'blocking', // true -> build page if missing, false -> serve 404
   }
}

const Main = styled.main`
   display: grid;
   grid-template-rows: 1fr;
   grid-template-columns: 240px 1fr;
   @media (max-width: 768px) {
      display: block;
   }
`

const ProductCards = styled.ul`
   display: grid;
   grid-gap: 16px;
   grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
`

const Title = styled.h2(
   ({ theme }) => css`
      ${tw`px-3 pt-3 pb-1 mb-2 text-green-600 text-2xl`}
      ${theme?.accent && `color: ${theme.accent}`}
   `
)

const Wrapper = styled.div`
   display: grid;
   background: #fff;
   grid-template-columns: 280px 1fr;
   > aside {
      height: calc(100vh - 64px);
   }
   @media (max-width: 768px) {
      display: block;
      > aside {
         height: max-content;
      }
   }
`

const Date = styled.li(
   ({ theme }) => css`
      ${tw`cursor-pointer px-2 py-2 rounded hover:(text-white bg-green-400)`}
      &.active {
         ${tw`text-white bg-green-600 hover:(bg-green-700)`}
         ${theme?.highlight &&
         css`
            background: ${theme.highlight};
            :hover {
               background: ${theme.highlight};
            }
         `}
      }
   `
)

const selectColor = variant => {
   switch (variant) {
      case 'ORDER_PENDING':
         return '#FF5A52'
      case 'ORDER_UNDER_PROCESSING':
         return '#FBB13C'
      case 'ORDER_READY_TO_DISPATCH':
         return '#3C91E6'
      case 'ORDER_OUT_FOR_DELIVERY':
         return '#1EA896'
      case 'ORDER_DELIVERED':
         return '#53C22B'
      default:
         return '#FF5A52'
   }
}

const Status = styled.span(
   ({ status }) => css`
      background: ${selectColor(status)};
      ${tw`px-2 py-1 rounded text-white`}
   `
)
