/* eslint-disable jsx-a11y/no-onchange */

import React from 'react'
import moment from 'moment'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { rrulestr } from 'rrule'
import tw, { styled, css } from 'twin.macro'
import ReactImageFallback from 'react-image-fallback'
import { isEmpty, uniqBy } from 'lodash'
import { useLazyQuery, useQuery } from '@apollo/react-hooks'
import { webRenderer } from '@dailykit/web-renderer'
import ReactHtmlParser from 'react-html-parser'

import { useConfig } from '../../lib'
import { foldsResolver, formatDate, getRoute, isClient } from '../../utils'
import { ArrowLeftIcon, ArrowRightIcon } from '../../assets/icons'
import { Layout, SEO, Form, HelperBar, Loader, Spacer } from '../../components'
import {
   OUR_MENU,
   GET_FILEID,
   OCCURENCE_PRODUCTS_BY_CATEGORIES,
   NAVIGATION_MENU,
   WEBSITE_PAGE,
} from '../../graphql'
import { GET_FILES } from '../../graphql'
import { graphQLClient } from '../../lib'
import 'regenerator-runtime'
import { fileParser, getSettings } from '../../utils'

const OurMenu = props => {
   const { folds, settings, navigationMenus } = props

   React.useEffect(() => {
      try {
         if (folds.length && typeof document !== 'undefined') {
            /*Filter undefined scripts*/
            const scripts = folds.flatMap(fold => fold.scripts)
            const filterScripts = scripts.filter(Boolean)
            if (Boolean(filterScripts.length)) {
               const fragment = document.createDocumentFragment()
               filterScripts.forEach(script => {
                  const s = document.createElement('script')
                  s.setAttribute('type', 'text/javascript')
                  s.setAttribute('src', script)
                  fragment.appendChild(s)
               })
               document.body.appendChild(fragment)
            }
         }
      } catch (err) {
         console.log('Failed to render page: ', err)
      }
   }, [folds])
   const renderComponent = fold => {
      try {
         if (fold.component) {
            return <Content />
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
                     const targetDiv = document.querySelector(
                        `[data-fold-id='${fold.id}']`
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
         <SEO title="Our Menu" />
         <main className="hern-our-menu">{renderPageContent(folds)}</main>
      </Layout>
   )
}

export default OurMenu

const Content = ({ data }) => {
   const [current, setCurrent] = React.useState(0)
   const [occurences, setOccurences] = React.useState([])
   const [categories, setCategories] = React.useState([])
   const [isCategoriesLoading, setIsCategoriesLoading] = React.useState(true)
   const [isOccurencesLoading, setIsOccurencesLoading] = React.useState(true)
   const { brand, configOf, buildImageUrl, noProductImage } =
      useConfig('conventions')

   const [fetchProducts] = useLazyQuery(OCCURENCE_PRODUCTS_BY_CATEGORIES, {
      onCompleted: ({ categories = [] }) => {
         setCategories(categories)
         setIsCategoriesLoading(false)
         return
      },
      onError: () => {
         setIsCategoriesLoading(false)
      },
   })

   const [fetchSubscription, { data: { subscription = {} } = {} }] =
      useLazyQuery(OUR_MENU.SUBSCRIPTION, {
         onCompleted: ({ subscription = {} }) => {
            if (subscription.occurences.length > 0) {
               const validOccurences = subscription.occurences.filter(
                  node => node.isVisible
               )
               if (validOccurences?.length > 0) {
                  setOccurences(validOccurences)

                  let nearest
                  let nearestIndex
                  const today = moment().format('YYYY-MM-DD')
                  validOccurences.forEach(node => {
                     const { fulfillmentDate: date } = node
                     let diff = moment(date).diff(moment(today), 'days')
                     if (diff > 0) {
                        if (nearest) {
                           if (moment(date).diff(moment(nearest), 'days') < 0) {
                              nearest = node
                           }
                        } else {
                           nearest = node
                        }
                     }
                  })

                  if (nearest) {
                     const index = validOccurences.findIndex(
                        node => node.id === nearest.id
                     )
                     if (index !== -1) {
                        nearestIndex = index
                     }
                  }

                  setIsCategoriesLoading(true)
                  setCurrent(nearestIndex || 0)
                  fetchProducts({
                     variables: {
                        occurenceId: {
                           _eq: validOccurences[nearestIndex || 0].id,
                        },
                        subscriptionId: { _eq: subscription.id },
                     },
                  })
               }
            }
            setIsOccurencesLoading(false)
         },
         onError: () => {
            setIsOccurencesLoading(false)
         },
      })

   const [
      fetchItemCount,
      { loading: loadingItemCount, data: { itemCount = {} } = {} },
   ] = useLazyQuery(OUR_MENU.ITEM_COUNT, {
      onCompleted: ({ itemCount = {} }) => {
         if (itemCount.subscriptions.length > 0) {
            const [subscription] = itemCount.subscriptions
            setIsOccurencesLoading(true)
            fetchSubscription({ variables: { id: subscription.id } })
         }
      },
   })

   const [
      fetchServing,
      { loading: loadingServing, data: { serving = {} } = {} },
   ] = useLazyQuery(OUR_MENU.SERVING, {
      onCompleted: ({ serving = {} }) => {
         if (serving.counts.length > 0) {
            const [count] = serving.counts
            fetchItemCount({ variables: { id: count.id } })
         }
      },
   })

   const [fetchTitle, { loading: loadingTitle, data: { title = {} } = {} }] =
      useLazyQuery(OUR_MENU.TITLE, {
         onCompleted: ({ title = {} }) => {
            if (title?.servings.length > 0) {
               const [serving] = title?.servings
               fetchServing({ variables: { id: serving.id } })
               setCurrent(0)
            }
         },
      })

   const [fetchTitles, { loading, data: { titles = [] } = {} }] = useLazyQuery(
      OUR_MENU.TITLES,
      {
         onCompleted: ({ titles = [] }) => {
            if (titles.length > 0) {
               const [title] = titles
               fetchTitle({ variables: { id: title.id } })
            }
         },
      }
   )

   React.useEffect(() => {
      fetchTitles({
         variables: { brandId: brand.id },
      })
      return () => {
         setOccurences([])
         setCurrent(0)
         setCategories([])
      }
   }, [fetchTitles, brand.id])

   const next = () => {
      if (current === occurences.length - 1) return
      const nextOne = current + 1
      setCurrent(nextOne)
      fetchProducts({
         variables: {
            occurenceId: { _eq: occurences[nextOne].id },
            subscriptionId: { _eq: subscription.id },
         },
      })
   }

   const previous = () => {
      if (current === 0) return
      const previousOne = current - 1
      setCurrent(previousOne)
      fetchProducts({
         variables: {
            occurenceId: { _eq: occurences[previousOne].id },
            subscriptionId: { _eq: subscription.id },
         },
      })
   }

   const config = configOf('primary-labels')
   const theme = configOf('theme-color', 'Visual')
   const imageRatio = useConfig().configOf('image-aspect-ratio', 'Visual')

   const yieldLabel = {
      singular: config?.yieldLabel?.singular || 'serving',
      plural: config?.yieldLabel?.singular || 'servings',
   }
   const itemCountLabel = {
      singular: config?.itemLabel?.singular || 'recipe',
      plural: config?.itemLabel?.singular || 'recipes',
   }
   if (isEmpty(titles))
      return (
         <>
            <Spacer size="sm" />
            {/*TODO: Should be changed to plain css  */}
            <HelperBar type="info">
               <HelperBar.SubTitle>No Menu Available!</HelperBar.SubTitle>
            </HelperBar>
         </>
      )
   return (
      <>
         <div className="hern-our-menu__header">
            <div>
               {!loading && titles.length > 0 && (
                  <section className="hern-our-menu__select-section__plans">
                     <Form.Label htmlFor="plans">Plans</Form.Label>
                     <select
                        id="plans"
                        name="plans"
                        value={title.id}
                        onChange={e =>
                           fetchTitle({ variables: { id: e.target.value } })
                        }
                     >
                        {titles.map(({ id, title }) => (
                           <option key={id} value={id}>
                              {title}
                           </option>
                        ))}
                     </select>
                  </section>
               )}
               {[!loading, !loadingTitle].every(node => node) &&
                  title?.servings?.length > 0 && (
                     <section className="hern-our-menu__select-section__serving">
                        <Form.Label htmlFor="serving">
                           {yieldLabel.plural}
                        </Form.Label>
                        <select
                           id="servings"
                           name="servings"
                           value={serving.id}
                           onChange={e =>
                              fetchServing({
                                 variables: { id: e.target.value },
                              })
                           }
                        >
                           {title?.servings.map(({ id, size }) => (
                              <option key={id} value={id}>
                                 {size}
                              </option>
                           ))}
                        </select>
                     </section>
                  )}

               {[!loading, !loadingTitle, !loadingServing].every(
                  node => node
               ) &&
                  serving?.counts?.length > 0 && (
                     <section className="hern-our-menu__select-section__counts">
                        <Form.Label htmlFor="counts">
                           {itemCountLabel.plural}
                        </Form.Label>
                        <select
                           id="counts"
                           name="counts"
                           value={itemCount.id}
                           onChange={e =>
                              fetchItemCount({
                                 variables: { id: e.target.value },
                              })
                           }
                        >
                           {serving?.counts.map(({ id, count }) => (
                              <option key={id} value={id}>
                                 {count}
                              </option>
                           ))}
                        </select>
                     </section>
                  )}
               {[
                  !loading,
                  !loadingTitle,
                  !loadingServing,
                  !loadingItemCount,
               ].every(node => node) &&
                  itemCount?.subscriptions?.length > 0 && (
                     <section className="hern-our-menu__select-section__subscriptions">
                        <Form.Label htmlFor="subscriptions">
                           Delivery Day
                        </Form.Label>
                        <select
                           id="subscriptions"
                           name="subscriptions"
                           value={subscription.id}
                           onChange={e =>
                              fetchSubscription({
                                 variables: { id: e.target.value },
                              })
                           }
                        >
                           {itemCount?.subscriptions.map(({ id, rrule }) => (
                              <option key={id} value={id}>
                                 {rrulestr(rrule).toText()}
                              </option>
                           ))}
                        </select>
                     </section>
                  )}
            </div>
         </div>
         {isOccurencesLoading || isCategoriesLoading ? (
            <Loader inline />
         ) : (
            <>
               {occurences.length === 0 ? (
                  <HelperBar type="info">
                     <HelperBar.SubTitle>
                        No weeks are available.
                     </HelperBar.SubTitle>
                  </HelperBar>
               ) : (
                  <div className="hern-our-menu__occurences">
                     <button
                        className="hern-our-menu__occurences___btn--left"
                        onClick={previous}
                        disabled={current === 0}
                     >
                        <span>
                           <ArrowLeftIcon
                              className={`hern-our-menu__occurences___btn__icon${
                                 current === 0 ? '--disabled' : ''
                              }`}
                           />
                        </span>
                        Past week
                     </button>
                     {current in occurences && (
                        <span className="hern-our-menu__occurences__current-date-range">
                           Showing menu of:&nbsp;
                           {formatDate(
                              moment(occurences[current]?.fulfillmentDate)
                                 .subtract(7, 'days')
                                 .format('YYYY-MM-DD'),
                              {
                                 month: 'short',
                                 day: 'numeric',
                                 year: 'numeric',
                              }
                           )}
                           &nbsp;-&nbsp;
                           {formatDate(occurences[current]?.fulfillmentDate, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                           })}
                        </span>
                     )}

                     <button
                        className="hern-our-menu__occurences___btn--right"
                        onClick={next}
                        disabled={current === occurences.length - 1}
                     >
                        Upcoming Week
                        <span>
                           <ArrowRightIcon
                              className={`hern-our-menu__occurences___btn__icon${
                                 current === occurences.length - 1
                                    ? '--disabled'
                                    : ''
                              }`}
                           />
                        </span>
                     </button>
                  </div>
               )}
               <main className="hern-our-menu__products">
                  {categories.length > 0 ? (
                     categories.map(category => (
                        <section
                           key={category.name}
                           className="hern-our-menu__products__wrapper"
                        >
                           <h4 className="hern-our-menu__products__category-title">
                              {category.name} (
                              {
                                 uniqBy(category.productsAggregate.nodes, v =>
                                    [
                                       v?.cartItem?.productId,
                                       v?.cartItem?.option?.productOptionId,
                                    ].join()
                                 ).length
                              }
                              )
                           </h4>
                           <ul className="hern-our-menu__product-list">
                              {uniqBy(category.productsAggregate.nodes, v =>
                                 [
                                    v?.cartItem?.productId,
                                    v?.cartItem?.option?.productOptionId,
                                 ].join()
                              ).map(node => (
                                 <Product
                                    node={node}
                                    theme={theme}
                                    key={node.id}
                                    buildImageUrl={buildImageUrl}
                                    noProductImage={noProductImage}
                                    imageRatio={imageRatio}
                                 />
                              ))}
                           </ul>
                        </section>
                     ))
                  ) : (
                     <HelperBar type="info">
                        <HelperBar.SubTitle>
                           No products available this week!
                        </HelperBar.SubTitle>
                     </HelperBar>
                  )}
               </main>
            </>
         )}
      </>
   )
}

const Product = ({
   node,
   theme,
   noProductImage,
   buildImageUrl,
   imageRatio,
}) => {
   const router = useRouter()

   const product = {
      name: node?.productOption?.product?.name || '',
      label: node?.productOption?.label || '',
      type: node?.productOption?.simpleRecipeYield?.simpleRecipe?.type,
      image:
         node?.productOption?.product?.assets?.images?.length > 0
            ? node?.productOption?.product?.assets?.images[0]
            : null,
      additionalText: node?.productOption?.product?.additionalText || '',
      tags: node?.productOption?.product?.tags || [],
   }

   const openRecipe = () =>
      router.push(getRoute(`/recipes/${node?.productOption?.id}`))

   return (
      <li className="hern-our-menu__product-list__item">
         {!!product.type && (
            <span className="hern-our-menu__product-type-indicator">
               <img
                  alt="Non-Veg Icon"
                  src={
                     product.type === 'Non-vegetarian'
                        ? '/imgs/non-veg.png'
                        : '/imgs/veg.png'
                  }
                  title={product.type}
               />
            </span>
         )}
         <ImageWrapper imageRatio={imageRatio} onClick={openRecipe}>
            {product.image ? (
               <ReactImageFallback
                  src={buildImageUrl('400x300', product.image)}
                  fallbackImage={product.image}
                  initialImage={<Loader />}
                  alt={product.name}
                  className="image__thumbnail"
               />
            ) : (
               <img src={noProductImage} alt={product.name} />
            )}
         </ImageWrapper>
         {node?.addOnLabel && (
            <span className="hern-our-menu__product-label">
               {node?.addOnLabel}
            </span>
         )}
         <section>
            <a
               className="hern-our-menu__product-link "
               theme={theme}
               onClick={openRecipe}
            >
               {product.name} - {product.label}
            </a>
         </section>
         <p>{product?.additionalText}</p>
         {product.tags.length > 0 && (
            <ul className="hern-our-menu__product-tag-list">
               {product.tags.map(tag => (
                  <li className="hern-our-menu__product-tag-list__item">
                     {tag}
                  </li>
               ))}
            </ul>
         )}
      </li>
   )
}

/*TODO: Image aspect  ration div (can't pass ratio to the file)*/
const ImageWrapper = styled.div(
   ({ imageRatio }) => css`
      ${tw`flex items-center justify-center bg-gray-200 mb-2 rounded overflow-hidden cursor-pointer `}
      ${imageRatio && imageRatio.width
         ? `aspect-ratio: ${imageRatio.height}/ ${imageRatio.width} }`
         : tw`aspect-w-4 aspect-h-3`}
   `
)

export async function getStaticProps({ params }) {
   const client = await graphQLClient()

   const dataByRoute = await client.request(WEBSITE_PAGE, {
      domain: params.brand,
      route: '/our-menu',
   })
   // const domain =
   //    process.env.NODE_ENV === 'production'
   //       ? params.domain
   //       : 'test.dailykit.org'
   const domain = 'test.dailykit.org'
   const { seo, settings } = await getSettings(domain, '/')

   //navigation menu
   const navigationMenu = await client.request(NAVIGATION_MENU, {
      navigationMenuId:
         dataByRoute.website_websitePage[0]['website']['navigationMenuId'],
   })

   //const parsedData = await fileParser(data.content_subscriptionDivIds)
   const parsedData = await foldsResolver(
      dataByRoute.website_websitePage[0]['websitePageModules']
   )
   const navigationMenus = navigationMenu.website_navigationMenuItem

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
