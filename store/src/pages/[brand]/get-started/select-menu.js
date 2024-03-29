import React from 'react'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import tw, { styled } from 'twin.macro'
import { useQuery } from '@apollo/react-hooks'
import { webRenderer } from '@dailykit/web-renderer'
import { GET_FILEID } from '../../../graphql'
import {
   Menu,
   CartPanel,
   WeekPicker,
   MenuProvider,
   useMenu,
} from '../../../sections/select-menu'
import { useConfig } from '../../../lib'
import { useUser } from '../../../context'
import {
   SEO,
   Layout,
   StepsNavbar,
   HelperBar,
   Loader,
} from '../../../components'
import { getRoute, getSettings, get_env, isClient } from '../../../utils'

const SelectMenu = props => {
   const { settings } = props
   const router = useRouter()
   const { isAuthenticated } = useUser()
   React.useEffect(() => {
      if (!isAuthenticated) {
         isClient && localStorage.setItem('landed_on', location.href)
         router.push(getRoute('/get-started/register'))
      }
   }, [isAuthenticated])

   const { configOf } = useConfig('Select-Menu')
   const config = configOf('select-menu-header')

   return (
      <MenuProvider isCheckout>
         <Layout settings={settings}>
            <SEO title="Select Menu" />
            <StepsNavbar />
            <Main>
               <div>
                  <WeekPicker isFixed />
                  <Header
                     url={
                        !isEmpty(config?.header?.images)
                           ? config?.header?.images[0]?.url
                           : ''
                     }
                  >
                     {config?.header?.heading && (
                        <h1 css={tw`text-4xl text-white z-10`}>
                           {config?.header?.heading}
                        </h1>
                     )}
                     {config?.header?.subHeading && (
                        <h3 css={tw`text-xl text-gray-100 z-10`}>
                           {config?.header?.subHeading}
                        </h3>
                     )}
                  </Header>
               </div>
               <MenuContent />
            </Main>
            <div id="select-menu-bottom-01"></div>
         </Layout>
      </MenuProvider>
   )
}

export default SelectMenu

const MenuContent = () => {
   const { state } = useMenu()
   const { loading } = useQuery(GET_FILEID, {
      variables: {
         divId: ['select-menu-bottom-01'],
      },
      onCompleted: ({ content_subscriptionDivIds: fileData }) => {
         if (fileData.length) {
            fileData.forEach(data => {
               if (data?.fileId) {
                  const fileId = [data?.fileId]
                  const cssPath =
                     data?.subscriptionDivFileId?.linkedCssFiles.map(file => {
                        return file?.cssFile?.path
                     })
                  const jsPath = data?.subscriptionDivFileId?.linkedJsFiles.map(
                     file => {
                        return file?.jsFile?.path
                     }
                  )
                  webRenderer({
                     type: 'file',
                     config: {
                        uri: isClient && get_env('DATA_HUB_HTTPS'),
                        adminSecret: isClient && get_env('ADMIN_SECRET'),
                        expressUrl: isClient && get_env('EXPRESS_URL'),
                     },
                     fileDetails: [
                        {
                           elementId: 'select-menu-bottom-01',
                           fileId,
                           cssPath: cssPath,
                           jsPath: jsPath,
                        },
                     ],
                  })
               }
            })
         }
      },

      onError: error => {
         console.error(error)
      },
   })

   if (state?.isOccurencesLoading || loading) {
      return (
         <section tw="p-3">
            <Loader inline />
         </section>
      )
   }
   if (!state?.week?.id)
      return (
         <section tw="p-3">
            <HelperBar type="info">
               <HelperBar.SubTitle>
                  No menu available for this week!
               </HelperBar.SubTitle>
            </HelperBar>
         </section>
      )
   return (
      <Content>
         <Menu />
         <CartPanel noSkip isCheckout />
      </Content>
   )
}

const Main = styled.main`
   margin: auto;
   padding-bottom: 24px;
   min-height: calc(100vh - 128px);
`

const Header = styled.header`
   height: 480px;
   position: relative;
   ${tw`bg-gray-100 flex flex-col items-center justify-center`}
   ::before {
      content: '';
      position: absolute;
      height: 100%;
      width: 100%;
      z-index: 0;
      background-image: url(${props => props.url});
      ${tw`bg-no-repeat bg-center bg-cover`}
   }
   ::after {
      content: '';
      position: absolute;
      height: 100%;
      width: 100%;
      z-index: 1;
      ${tw`bg-black opacity-25`}
   }
`

const Content = styled.section`
   ${tw`px-4 grid gap-8`}
   grid-template-columns: 1fr 400px;
   @media (max-width: 768px) {
      grid-template-columns: 1fr;
   }
`
export async function getStaticProps({ params }) {
   // const domain =
   //    process.env.NODE_ENV === 'production'
   //       ? params.domain
   //       : 'test.dailykit.org'
   const domain = 'test.dailykit.org'
   const { seo, settings } = await getSettings(domain, '/')

   return {
      props: { seo, settings },
      revalidate: 60, // will be passed to the page component as props
   }
}

export async function getStaticPaths() {
   return {
      paths: [],
      fallback: 'blocking', // true -> build page if missing, false -> serve 404
   }
}
