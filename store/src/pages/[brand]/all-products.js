import router from 'next/router'
import React from 'react'
import styled from 'styled-components'
import { Layout, SEO } from '../../components'
import { NAVIGATION_MENU, WEBSITE_PAGE } from '../../graphql'
import { graphQLClient } from '../../lib'
import { foldsResolver, getSettings, get_env } from '../../utils'
import ReactHtmlParser from 'react-html-parser'
import axios from 'axios'

// Page for displaying all products
const AllProducts = ({ params, seo, settings, navigationMenus, folds }) => {
   console.log({ folds })

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
            // Attach css from fold
         }
      } catch (err) {
         console.log('Failed to render page: ', err)
      }
   }, [folds])

   const renderComponent = fold => {
      try {
         if (fold.component) {
            switch (fold.component) {
               case 'Products':
                  return <Products />
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
                     console.log(data)
                     const targetDiv = document.getElementById(fold.id)
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
         <div key={fold.id} id={fold.id}>
            {renderComponent(fold)}
         </div>
      ))
   }

   return (
      <Layout settings={settings} navigationMenus={navigationMenus}>
         <SEO title="All Products" />
         <Main>{renderPageContent(folds)}</Main>
      </Layout>
   )
}

export default AllProducts

const Products = () => {
   //  Add queries and subscription here

   const products = [
      {
         id: 1,
         name: 'Pizza',
         price: '$5',
      },
      {
         id: 2,
         name: 'Hot Chocolate',
         price: '$3',
      },
      {
         id: 3,
         name: 'Salad',
         price: '$4',
      },
   ]

   return (
      <ProductsWrapper>
         {products.map(product => (
            <ProductWrapper key={product.id}>
               <h2>{product.name}</h2>
               <span>{product.price}</span>
            </ProductWrapper>
         ))}
      </ProductsWrapper>
   )
}

export async function getStaticProps(ctx) {
   const params = ctx.params
   const domain = 'test.dailykit.org'
   // const domain =
   //    process.env.NODE_ENV === 'production'
   //       ? params.domain
   //       : 'test.dailykit.org'
   //page data

   //brand settings
   const { seo, settings } = await getSettings(domain, `/all-products`)

   //page folds data
   const client = await graphQLClient()
   const data = await client.request(WEBSITE_PAGE, {
      domain: params.brand,
      route: '/all-products',
   })

   if (data.website_websitePage.length > 0) {
      console.log(data.website_websitePage)

      //parsed data of page
      const parsedData = await foldsResolver(
         data.website_websitePage[0]['websitePageModules']
      )
      //navigation menu for page

      const navigationMenu = await client.request(NAVIGATION_MENU, {
         navigationMenuId:
            data.website_websitePage[0]['linkedNavigationMenuId'],
      })

      //navigation menus for page
      const navigationMenus = navigationMenu.website_navigationMenuItem
      const props = {
         params,
         navigationMenus,
         seo,
         settings,
         folds: parsedData,
      }
      return { props, revalidate: 1 }
   } else {
      const props = {
         params,
         seo,
         settings,
         data: data.website_websitePage,
         navigationMenus: [],
      }
      return { props, revalidate: 1 }
   }
}

export async function getStaticPaths() {
   return {
      paths: [],
      fallback: 'blocking', // true -> build page if missing, false -> serve 404
   }
}

const Main = styled.main`
   margin: auto;
   overflow-y: auto;
   max-width: 1180px;
   width: calc(100vw - 40px);
   min-height: calc(100vh - 128px);
   > section {
      width: 100%;
      max-width: 360px;
   }
`

const ProductsWrapper = styled.section`
   display: grid;
   grid-template-columns: repeat(3, 1fr);
   gap: 32px;
   padding: 32px 16px;
`

const ProductWrapper = styled.section`
   box-shadow: 0px 0px 1px 5px #efefef;
   padding: 16px;
   color: #1a1a1a;
   border-radius: 4px;
   display: flex;
   align-items: center;
   justify-content: space-between;

   h2 {
      font-weight: bold;
   }

   span {
      font-style: italic;
   }
`
