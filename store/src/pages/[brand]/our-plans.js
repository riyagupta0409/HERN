import React from 'react'
import ReactHtmlParser from 'react-html-parser'
import { NAVIGATION_MENU, WEBSITE_PAGE } from '../../graphql'
import { SEO, Layout } from '../../components'
import { graphQLClient } from '../../lib'
import { getSettings, foldsResolver } from '../../utils'
import dynamic from 'next/dynamic'
import 'regenerator-runtime'

/*FIXME: Navigation menu item is not visible due to <span> and <a>*/
const Plans = dynamic(() =>
   import('../../sections/select-plan').then(promise => promise.Plans)
)

const SelectPlan = props => {
   const { folds, settings, navigationMenus } = props
   /* FIXME: Most Probably SyntaxError: Unexpected token '<' is coming from this effect*/
   React.useEffect(() => {
      try {
         if (folds.length && typeof document !== 'undefined') {
            const scripts = folds.flatMap(fold => fold.scripts)
            const fragment = document.createDocumentFragment()

            scripts.forEach(script => {
               const s = document.createElement('script')
               s.setAttribute('type', 'text/javascript')
               s.setAttribute('src', script)
               fragment.appendChild(s)
            })
            document.body.appendChild(fragment)
         }
      } catch (err) {
         console.log('Failed to render page: ', err)
      }
   }, [folds])

   const renderComponent = fold => {
      try {
         if (fold.component) {
            switch (fold.component) {
               case 'Plans':
                  return <Plans />

               default:
                  return null
            }
         } else if (fold.content) {
            return ReactHtmlParser(fold.content)
         } else {
            // const url = get_env('EXPRESS_URL') + `/template/hydrate-fold`
            const url = 'http://localhost:4000' + `/template/hydrate-fold`
            axios
               .post(url, {
                  id: fold.id,
                  brandId: settings['brand']['id'],
               })
               .then(response => {
                  const { data } = response
                  if (data.success) {
                     /*TODO: target should be made with data attribute */
                     const targetDiv = document.querySelector(
                        `[data-fold-id=${fold.id}]`
                     )
                     targetDiv.innerHTML = data.data
                  } else {
                     console.error(data.message)
                  }
               })
            return 'Loading...'
            // make request to template service
         }
      } catch (err) {
         console.log(err)
      }
   }

   const renderPageContent = folds => {
      return folds.map(fold => (
         <div
            key={fold.id}
            data-fold-id={fold.id}
            data-fold-position={fold.position}
            data-fold-type={fold.moduleType}
         >
            {renderComponent(fold)}
         </div>
      ))
   }

   return (
      <Layout settings={settings} navigationMenus={navigationMenus}>
         <SEO title="Plans" />
         <main className="hern-our-plans__main">
            {renderPageContent(folds)}
         </main>
      </Layout>
   )
}

export default SelectPlan

export const getStaticProps = async ({ params }) => {
   const client = await graphQLClient()

   const dataByRoute = await client.request(WEBSITE_PAGE, {
      domain: params.brand,
      route: '/our-plans',
   })

   const domain = 'test.dailykit.org'
   const { seo, settings } = await getSettings(domain, '/our-plans')

   //navigation menu
   const navigationMenu = await client.request(NAVIGATION_MENU, {
      navigationMenuId:
         dataByRoute.website_websitePage[0]['website']['navigationMenuId'],
   })
   const navigationMenus = navigationMenu.website_navigationMenuItem

   const parsedData = await foldsResolver(
      dataByRoute.website_websitePage[0]['websitePageModules']
   )

   return {
      props: { folds: parsedData, seo, settings, navigationMenus },
      revalidate: 60, // will be passed to the page component as props
   }
}
export async function getStaticPaths() {
   return {
      paths: [],
      fallback: 'blocking', // true -> build page if missing, false -> serve 404
   }
}
