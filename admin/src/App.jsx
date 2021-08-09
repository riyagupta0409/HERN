import React from 'react'
import gql from 'graphql-tag'
import Loadable from 'react-loadable'
import { Loader } from '@dailykit/ui'
import { useSubscription } from '@apollo/react-hooks'
import { Switch, Route, Link } from 'react-router-dom'
import FullOccurrenceReport from './shared/components/FullOccurrenceReport'
import { isKeycloakSupported } from './shared/utils'
import DashboardAnalytics from './shared/components/DashboardAnalytics'
import {
   TabBar,
   RedirectBanner,
   InsightDashboard,
   AddressTunnel,
   Banner,
} from './shared/components'
import { AppItem, AppList, Layout, InsightDiv } from './styled'
import BottomBar from './shared/components/BottomBar'
import {
   AcceptedAndRejectedAnalytics,
   OrderReceivedAnalytics,
   RegisteredCustomerAnalytics,
   SubscribedCustomerAnalytics,
   TotalEarningAnalytics,
} from './shared/components/DashboardAnalytics/Analytics'

const APPS = gql`
   subscription apps {
      apps(order_by: { id: asc }) {
         id
         title
         icon
         route
      }
   }
`

const Safety = Loadable({
   loader: () => import('./apps/safety'),
   loading: Loader,
})
const Inventory = Loadable({
   loader: () => import('./apps/inventory'),
   loading: Loader,
})
const Products = Loadable({
   loader: () => import('./apps/products'),
   loading: Loader,
})
const Menu = Loadable({
   loader: () => import('./apps/menu'),
   loading: Loader,
})
const Settings = Loadable({
   loader: () => import('./apps/settings'),
   loading: Loader,
})

const Order = Loadable({
   loader: () => import('./apps/order'),
   loading: Loader,
})

const CRM = Loadable({
   loader: () => import('./apps/crm'),
   loading: Loader,
})

const Subscription = Loadable({
   loader: () => import('./apps/subscription'),
   loading: Loader,
})

const Insights = Loadable({
   loader: () => import('./apps/insights'),
   loading: Loader,
})

const Brands = Loadable({
   loader: () => import('./apps/brands'),
   loading: Loader,
})
const Content = Loadable({
   loader: () => import('./apps/content'),
   loading: Loader,
})
const Editor = Loadable({
   loader: () => import('./apps/editor'),
   loading: Loader,
})
const Carts = Loadable({
   loader: () => import('./apps/carts'),
   loading: Loader,
})

// changes for webhooks 
const Developer = Loadable({
   loader: () => import('./apps/developer/webhook'),
   loading: Loader,
})

const App = () => {
   // const location = useLocation()
   // const { routes, setRoutes } = useTabs()

   const [open, toggle] = React.useState(false)
   const { loading, data: { apps = [] } = {} } = useSubscription(APPS)

   if (loading) return <Loader />
   return (
      <Layout>
         <TabBar />
         <main>
            <Switch>
               <Route path="/" exact>
                  <Banner id="app-home-top" />
                  <AppList open={open}>
                     {apps.map(app => (
                        <AppItem key={app.id}>
                           <Link to={app.route}>
                              {app.icon && (
                                 <img src={app.icon} alt={app.title} />
                              )}
                              <span>{app.title}</span>
                           </Link>
                        </AppItem>
                     ))}
                     {/* added webhook app temporarily */}
                     <AppItem >
                        <Link to='/developer/webhook'>
                           <span>Developer</span>
                        </Link>
                     </AppItem>
                     {/* added webhook app temporarily */}

                  </AppList>
                  <DashboardAnalytics>
                     <TotalEarningAnalytics />
                     <OrderReceivedAnalytics />
                     <AcceptedAndRejectedAnalytics />
                     <SubscribedCustomerAnalytics />
                     <RegisteredCustomerAnalytics />
                  </DashboardAnalytics>
                  <InsightDiv>
                     <InsightDashboard
                        appTitle="global"
                        moduleTitle="dashboard"
                        includeChart
                        showInTunnel={false}
                     />
                  </InsightDiv>
                  <Banner id="app-home-bottom" />
               </Route>
               <Route path="/inventory" component={Inventory} />
               <Route path="/safety" component={Safety} />
               <Route path="/products" component={Products} />
               <Route path="/menu" component={Menu} />
               <Route path="/settings" component={Settings} />
               <Route path="/order" component={Order} />
               <Route path="/crm" component={CRM} />
               <Route path="/subscription" component={Subscription} />
               <Route path="/insights" component={Insights} />
               <Route path="/brands" component={Brands} />
               <Route path="/content" component={Content} />
               <Route path="/editor" component={Editor} />
               <Route path="/carts" component={Carts} />
               <Route path="/developer/webhook" component={Developer} />
            </Switch>
         </main>
         {/* {!isKeycloakSupported() && <RedirectBanner />} */}
         <BottomBar />
      </Layout>
   )
}

export default App
