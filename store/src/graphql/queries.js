import gql from 'graphql-tag'

export const ITEM_COUNT = gql`
   query itemCount($id: Int!, $zipcode: String, $isDemo: Boolean) {
      itemCount: subscription_subscriptionItemCount_by_pk(id: $id) {
         id
         valid: subscriptions(
            where: {
               isDemo: { _eq: $isDemo }
               availableZipcodes: { zipcode: { _eq: $zipcode } }
            }
            order_by: { position: desc_nulls_last }
         ) {
            id
            isDemo
            rrule
            leadTime
            zipcodes: availableZipcodes(where: { zipcode: { _eq: $zipcode } }) {
               deliveryPrice
               isDeliveryActive
               isPickupActive
            }
         }
         invalid: subscriptions(
            where: {
               isDemo: { _eq: $isDemo }
               _not: { availableZipcodes: { zipcode: { _eq: $zipcode } } }
            }
            order_by: { position: desc_nulls_last }
         ) {
            id
            isDemo
            rrule
            leadTime
            zipcodes: availableZipcodes(where: { zipcode: { _eq: $zipcode } }) {
               deliveryPrice
               isDeliveryActive
               isPickupActive
            }
         }
      }
   }
`

export const PLANS = gql`
   subscription plans(
      $where: subscription_subscriptionTitle_bool_exp!
      $isDemo: Boolean!
   ) {
      plans: subscription_subscriptionTitle(where: $where) {
         id
         title
         isDemo
         metaDetails
         defaultServingId: defaultSubscriptionServingId
         defaultServing: defaultSubscriptionServing {
            id
            isDemo
            size: servingSize
            defaultItemCount: defaultSubscriptionItemCount {
               id
               isDemo
               count
               price
               isTaxIncluded
            }
            itemCounts: subscriptionItemCounts(
               where: { isDemo: { _eq: $isDemo } }
            ) {
               id
               count
               price
               isTaxIncluded
            }
         }
         servings: subscriptionServings(
            order_by: { servingSize: asc }
            where: { isDemo: { _eq: $isDemo }, isActive: { _eq: true } }
         ) {
            id
            isDemo
            metaDetails
            size: servingSize
            defaultItemCountId: defaultSubscriptionItemCountId
            defaultItemCount: defaultSubscriptionItemCount {
               id
               isDemo
               count
               price
               isTaxIncluded
            }
            itemCounts: subscriptionItemCounts(
               order_by: { count: asc, price: asc }
               where: { isDemo: { _eq: $isDemo }, isActive: { _eq: true } }
            ) {
               id
               isDemo
               count
               price
               metaDetails
               isTaxIncluded
            }
         }
      }
   }
`

export const OCCURENCES_BY_SUBSCRIPTION = gql`
   query subscription(
      $id: Int!
      $where: subscription_subscriptionOccurence_bool_exp
      $where1: subscription_subscriptionOccurence_customer_bool_exp
   ) {
      subscription: subscription_subscription_by_pk(id: $id) {
         id
         occurences: subscriptionOccurences(
            where: $where
            order_by: { fulfillmentDate: asc_nulls_last }
         ) {
            id
            isValid
            isVisible
            fulfillmentDate
            cutoffTimeStamp
            customers(where: $where1) {
               itemCountValid: validStatus(path: "itemCountValid")
            }
         }
      }
   }
`

export const OCCURENCE_ADDON_PRODUCTS_BY_CATEGORIES = gql`
   query categories(
      $subscriptionId: Int_comparison_exp
      $occurenceId: Int_comparison_exp
   ) {
      categories: productCategories(
         where: {
            subscriptionOccurenceAddOnProducts: {
               _or: [
                  { subscriptionId: $subscriptionId }
                  { subscriptionOccurenceId: $occurenceId }
               ]
               isAvailable: { _eq: true }
               isVisible: { _eq: true }
            }
         }
      ) {
         name
         productsAggregate: subscriptionOccurenceAddOnProducts_aggregate(
            where: {
               _or: [
                  { subscriptionId: $subscriptionId }
                  { subscriptionOccurenceId: $occurenceId }
               ]
            }
         ) {
            aggregate {
               count
            }
            nodes {
               id
               cartItem
               isSingleSelect
               productOption {
                  id
                  label
                  product {
                     name
                     assets
                     additionalText
                  }
               }
            }
         }
      }
   }
`

export const OCCURENCE_ADDON_PRODUCTS_AGGREGATE = gql`
   subscription productsAggregate(
      $subscriptionId: Int_comparison_exp
      $occurenceId: Int_comparison_exp
   ) {
      productsAggregate: subscription_subscriptionOccurence_addOn_aggregate(
         where: {
            _or: [
               { subscriptionId: $subscriptionId }
               { subscriptionOccurenceId: $occurenceId }
            ]
         }
      ) {
         aggregate {
            count
         }
      }
   }
`

export const OCCURENCE_PRODUCTS_BY_CATEGORIES = gql`
   query categories(
      $subscriptionId: Int_comparison_exp
      $occurenceId: Int_comparison_exp
   ) {
      categories: productCategories(
         where: {
            subscriptionOccurenceProducts: {
               _or: [
                  { subscriptionId: $subscriptionId }
                  { subscriptionOccurenceId: $occurenceId }
               ]
               isVisible: { _eq: true }
            }
         }
      ) {
         name
         productsAggregate: subscriptionOccurenceProducts_aggregate(
            where: {
               _or: [
                  { subscriptionId: $subscriptionId }
                  { subscriptionOccurenceId: $occurenceId }
               ]
            }
         ) {
            aggregate {
               count
            }
            nodes {
               id
               cartItem
               addOnLabel
               addOnPrice
               isAvailable
               isSingleSelect
               productOption {
                  id
                  label
                  simpleRecipeYield {
                     yield
                     simpleRecipe {
                        id
                        type
                     }
                  }
                  product {
                     name
                     assets
                     additionalText
                     tags
                  }
               }
            }
         }
      }
   }
`

export const RECIPE_DETAILS = gql`
   query productOption($optionId: Int!) {
      productOption(id: $optionId) {
         id
         label
         product {
            id
            name
         }
         simpleRecipeYield {
            id
            yield
            sachets: ingredientSachets {
               isVisible
               slipName
               sachet: ingredientSachet {
                  id
                  quantity
                  unit
                  ingredient {
                     id
                     assets
                  }
               }
            }
            simpleRecipe {
               id
               name
               type
               author
               cookingTime
               cuisine
               description
               assets
               utensils
               notIncluded
               showIngredients
               showIngredientsQuantity
               showProcedures
               instructionSets(order_by: { position: desc_nulls_last }) {
                  id
                  title
                  instructionSteps(order_by: { position: desc_nulls_last }) {
                     id
                     assets
                     description
                     isVisible
                     title
                  }
               }
            }
         }
      }
   }
`

export const PRODUCT_OPTION_WITH_RECIPES = gql`
   query ProductOptionsWithRecipes {
      productOptions(
         where: {
            isArchived: { _eq: false }
            simpleRecipeYieldId: { _neq: null }
            product: { isArchived: { _eq: false }, isPublished: { _eq: true } }
         }
      ) {
         id
      }
   }
`

export const INVENTORY_DETAILS = gql`
   query inventoryProduct(
      $id: Int!
      $args: products_inventoryProductCartItem_args!
   ) {
      inventoryProduct(id: $id) {
         cartItem(args: $args)
      }
   }
`

export const CART_BY_WEEK = gql`
   subscription subscriptionOccurenceCustomer(
      $keycloakId: String!
      $weekId: Int!
      $brand_customerId: Int!
   ) {
      subscriptionOccurenceCustomer: subscription_subscriptionOccurence_customer_by_pk(
         keycloakId: $keycloakId
         subscriptionOccurenceId: $weekId
         brand_customerId: $brand_customerId
      ) {
         isAuto
         isSkipped
         betweenPause
         validStatus
         cart {
            id
            status
            address
            paymentStatus
            walletAmountUsable
            loyaltyPointsUsable
            walletAmountUsed
            loyaltyPointsUsed
            billingDetails
            fulfillmentInfo
            transactionId
            paymentMethodId
            products: cartItems(where: { level: { _eq: 1 } }) {
               id
               name: displayName
               image: displayImage
               isAddOn
               unitPrice
               addOnLabel
               addOnPrice
               isAutoAdded
               subscriptionOccurenceProductId
               subscriptionOccurenceAddOnProductId
            }
         }
      }
   }
`

export const ZIPCODE = gql`
   subscription zipcode($subscriptionId: Int!, $zipcode: String!) {
      zipcode: subscription_subscription_zipcode_by_pk(
         subscriptionId: $subscriptionId
         zipcode: $zipcode
      ) {
         deliveryTime
         deliveryPrice
         isPickupActive
         isDeliveryActive
         defaultAutoSelectFulfillmentMode
         pickupOptionId: subscriptionPickupOptionId
         pickupOption: subscriptionPickupOption {
            id
            time
            address
         }
      }
   }
`

export const CART = gql`
   query cart($id: Int!) {
      cart(id: $id) {
         id
         tax
         tip
         address
         totalPrice
         paymentStatus
         deliveryPrice
         billingDetails
         fulfillmentInfo
         transactionId
         transactionRemark
         stripeInvoiceId
         stripeInvoiceDetails
         products: cartItems(where: { level: { _eq: 1 } }) {
            id
            isAddOn
            unitPrice
            addOnLabel
            addOnPrice
            isAutoAdded
            name: displayName
            image: displayImage
            subscriptionOccurenceProductId
            subscriptionOccurenceAddOnProductId
         }
      }
   }
`

export const CART_SUBSCRIPTION = gql`
   subscription cart($id: Int!) {
      cart(id: $id) {
         id
         tax
         tip
         address
         totalPrice
         paymentStatus
         deliveryPrice
         billingDetails
         fulfillmentInfo
         transactionId
         transactionRemark
         stripeInvoiceId
         stripeInvoiceDetails
         customerKeycloakId
         products: cartItems(where: { level: { _eq: 1 } }) {
            id
            isAddOn
            unitPrice
            addOnLabel
            addOnPrice
            isAutoAdded
            name: displayName
            image: displayImage
            subscriptionOccurenceProductId
            subscriptionOccurenceAddOnProductId
         }
      }
   }
`

export const CART_STATUS = gql`
   subscription cart($id: Int!) {
      cart(id: $id) {
         id
         status
         orderId
         address
         transactionId
         transactionRemark
         paymentStatus
         fulfillmentInfo
         billingDetails
         customerKeycloakId
         products: cartItems(where: { level: { _eq: 1 } }) {
            id
            name: displayName
            image: displayImage
            isAddOn
            unitPrice
            addOnLabel
            addOnPrice
            isAutoAdded
            subscriptionOccurenceProductId
            subscriptionOccurenceAddOnProductId
         }
      }
   }
`

export const ORDER_HISTORY = gql`
   subscription orders($keycloakId: String_comparison_exp!) {
      orders: subscription_subscriptionOccurence_customer_aggregate(
         where: {
            keycloakId: $keycloakId
            cart: { status: { _nin: ["CART_PENDING"] } }
         }
         order_by: { subscriptionOccurence: { fulfillmentDate: desc } }
      ) {
         aggregate {
            count
         }
         nodes {
            occurenceId: subscriptionOccurenceId
            occurence: subscriptionOccurence {
               date: fulfillmentDate
            }
         }
      }
   }
`

export const ORDER = gql`
   subscription order(
      $keycloakId: String!
      $subscriptionOccurenceId: Int!
      $brand_customerId: Int!
   ) {
      order: subscription_subscriptionOccurence_customer_by_pk(
         keycloakId: $keycloakId
         brand_customerId: $brand_customerId
         subscriptionOccurenceId: $subscriptionOccurenceId
      ) {
         isSkipped
         validStatus
         keycloakId
         occurrence: subscriptionOccurence {
            id
            subscription {
               id
               item: subscriptionItemCount {
                  id
                  price
               }
            }
         }
         cart {
            id
            status
            orderStatus {
               title
            }
            address
            itemTotal
            addOnTotal
            totalPrice
            deliveryPrice
            paymentMethodId
            billingDetails
            fulfillmentInfo
            paymentStatus
            products: cartItems(where: { level: { _eq: 1 } }) {
               id
               name: displayName
               image: displayImage
               isAddOn
               unitPrice
               addOnLabel
               addOnPrice
               isAutoAdded
               subscriptionOccurenceProductId
               subscriptionOccurenceAddOnProductId
            }
         }
      }
   }
`

export const ZIPCODE_AVAILABILITY = gql`
   query subscription_zipcode(
      $subscriptionId: Int_comparison_exp!
      $zipcode: String_comparison_exp!
   ) {
      subscription_zipcode: subscription_subscription_zipcode(
         where: { subscriptionId: $subscriptionId, zipcode: $zipcode }
      ) {
         zipcode
         subscriptionId
      }
   }
`

export const INFORMATION_GRID = gql`
   subscription infoGrid($identifier: String_comparison_exp!) {
      infoGrid: content_informationGrid(
         where: { isVisible: { _eq: true }, identifier: $identifier }
      ) {
         id
         heading
         subHeading
         identifier
         columnsCount
         blockOrientation
         blocks: informationBlocks {
            id
            title
            thumbnail
            description
         }
      }
   }
`

export const FAQ = gql`
   subscription faq(
      $page: String_comparison_exp!
      $identifier: String_comparison_exp!
   ) {
      faq: content_faqs(
         where: {
            page: $page
            isVisible: { _eq: true }
            identifier: $identifier
         }
      ) {
         id
         heading
         subHeading
         identifier
         blocks: informationBlocks {
            id
            title
            description
         }
      }
   }
`

export const OUR_MENU = {
   TITLES: gql`
      query titles($brandId: Int!) {
         titles: subscription_subscriptionTitle(
            where: {
               isActive: { _eq: true }
               brands: { brandId: { _eq: $brandId }, isActive: { _eq: true } }
            }
         ) {
            id
            title
         }
      }
   `,
   TITLE: gql`
      query title($id: Int!) {
         title: subscription_subscriptionTitle_by_pk(id: $id) {
            id
            servings: subscriptionServings(where: { isActive: { _eq: true } }) {
               id
               size: servingSize
            }
         }
      }
   `,
   SERVING: gql`
      query serving($id: Int!) {
         serving: subscription_subscriptionServing_by_pk(id: $id) {
            id
            size: servingSize
            counts: subscriptionItemCounts(where: { isActive: { _eq: true } }) {
               id
               count
            }
         }
      }
   `,
   ITEM_COUNT: gql`
      query itemCount($id: Int!) {
         itemCount: subscription_subscriptionItemCount_by_pk(id: $id) {
            id
            count
            subscriptions {
               id
               rrule
            }
         }
      }
   `,
   SUBSCRIPTION: gql`
      query subscription($id: Int!) {
         subscription: subscription_subscription_by_pk(id: $id) {
            id
            occurences: subscriptionOccurences(
               order_by: { fulfillmentDate: asc }
            ) {
               id
               isValid
               isVisible
               fulfillmentDate
            }
         }
      }
   `,
}

export const SETTINGS = gql`
   subscription settings($domain: String_comparison_exp) {
      settings: brands_brand_subscriptionStoreSetting(
         where: {
            brand: { _or: [{ domain: $domain }, { isDefault: { _eq: true } }] }
         }
      ) {
         value
         brandId
         meta: subscriptionStoreSetting {
            id
            type
            identifier
         }
      }
   }
`

export const SETTINGS_QUERY = gql`
   query settings($domain: String) {
      settings: brands_brand_subscriptionStoreSetting(
         where: {
            brand: {
               _or: [{ domain: { _eq: $domain } }, { isDefault: { _eq: true } }]
            }
         }
      ) {
         value
         brandId
         meta: subscriptionStoreSetting {
            id
            type
            identifier
         }
      }
   }
`

export const BRAND_CUSTOMER = gql`
   subscription brandCustomer($id: Int!) {
      brandCustomer(id: $id) {
         id
         subscriptionOnboardStatus
      }
   }
`

export const CUSTOMER = {
   DETAILS: gql`
      subscription customer($keycloakId: String!, $brandId: Int!) {
         customer(keycloakId: $keycloakId) {
            id
            keycloakId
            isSubscriber
            isTest
            carts {
               id
               paymentStatus
               subscriptionOccurence {
                  fulfillmentDate
               }
            }
            brandCustomers(where: { brandId: { _eq: $brandId } }) {
               id
               isDemo
               brandId
               keycloakId
               isSubscriber
               isSubscriptionCancelled
               pausePeriod
               subscriptionId
               subscriptionAddressId
               subscriptionPaymentMethodId
               subscriptionOnboardStatus
               subscription {
                  recipes: subscriptionItemCount {
                     count
                     price
                     tax
                     isTaxIncluded
                     servingId: subscriptionServingId
                     serving: subscriptionServing {
                        size: servingSize
                     }
                  }
               }
            }
            platform_customer: platform_customer_ {
               email
               firstName
               lastName
               keycloakId
               phoneNumber
               stripeCustomerId
               addresses: customerAddresses_(order_by: { created_at: desc }) {
                  id
                  lat
                  lng
                  line1
                  line2
                  city
                  state
                  country
                  zipcode
                  label
                  notes
               }
               paymentMethods: stripePaymentMethods_ {
                  brand
                  last4
                  country
                  expMonth
                  expYear
                  funding
                  keycloakId
                  cardHolderName
                  stripePaymentMethodId
               }
            }
         }
      }
   `,
   DETAILS_QUERY: gql`
      query customer($keycloakId: String!, $brandId: Int!) {
         customer(keycloakId: $keycloakId) {
            id
            keycloakId
            isSubscriber
            isTest
            carts {
               id
               paymentStatus
               subscriptionOccurence {
                  fulfillmentDate
               }
            }
            brandCustomers(where: { brandId: { _eq: $brandId } }) {
               id
               isDemo
               brandId
               keycloakId
               isSubscriber
               isSubscriptionCancelled
               pausePeriod
               subscriptionId
               subscriptionAddressId
               subscriptionPaymentMethodId
               subscriptionOnboardStatus
               subscription {
                  recipes: subscriptionItemCount {
                     count
                     price
                     tax
                     isTaxIncluded
                     servingId: subscriptionServingId
                     serving: subscriptionServing {
                        size: servingSize
                     }
                  }
               }
            }
            platform_customer: platform_customer_ {
               email
               firstName
               lastName
               keycloakId
               phoneNumber
               stripeCustomerId
               addresses: customerAddresses_(order_by: { created_at: desc }) {
                  id
                  lat
                  lng
                  line1
                  line2
                  city
                  state
                  country
                  zipcode
                  label
                  notes
               }
               paymentMethods: stripePaymentMethods_ {
                  brand
                  last4
                  country
                  expMonth
                  expYear
                  funding
                  keycloakId
                  cardHolderName
                  stripePaymentMethodId
               }
            }
         }
      }
   `,
   WITH_BRAND: gql`
      query customers(
         $where: crm_customer_bool_exp = {}
         $brandId: Int_comparison_exp = {}
      ) {
         customers(where: $where) {
            id
            brandCustomers(where: { brandId: $brandId }) {
               id
               subscriptionOnboardStatus
            }
         }
      }
   `,
}

export const GET_FILEID = gql`
   query GET_FILEID($divId: [String!]!) {
      content_subscriptionDivIds(where: { id: { _in: $divId } }) {
         fileId
         id
         subscriptionDivFileId {
            linkedCssFiles {
               cssFile {
                  path
               }
            }
            linkedJsFiles {
               jsFile {
                  path
               }
            }
         }
      }
   }
`

export const GET_FILES = gql`
   query GET_FILES($divId: [String!]!) {
      content_subscriptionDivIds(where: { id: { _in: $divId } }) {
         id
         fileId
         subscriptionDivFileId {
            id
            path
            linkedCssFiles {
               id
               cssFile {
                  id
                  path
               }
            }
            linkedJsFiles {
               id
               jsFile {
                  id
                  path
               }
            }
         }
      }
   }
`

export const COUPONS = gql`
   subscription Coupons($params: jsonb, $brandId: Int!) {
      coupons(
         where: {
            isActive: { _eq: true }
            isArchived: { _eq: false }
            brands: { brandId: { _eq: $brandId }, isActive: { _eq: true } }
         }
      ) {
         id
         code
         isRewardMulti
         rewards(order_by: { position: desc_nulls_last }) {
            id
            condition {
               isValid(args: { params: $params })
            }
         }
         metaDetails
         visibilityCondition {
            isValid(args: { params: $params })
         }
      }
   }
`

export const SEARCH_COUPONS = gql`
   query SearchCoupons($typedCode: String!, $params: jsonb, $brandId: Int!) {
      coupons(
         where: {
            code: { _eq: $typedCode }
            isActive: { _eq: true }
            isArchived: { _eq: false }
            brands: { brandId: { _eq: $brandId }, isActive: { _eq: true } }
         }
      ) {
         id
         isRewardMulti
         metaDetails
         rewards(order_by: { position: desc_nulls_last }) {
            id
            condition {
               isValid(args: { params: $params })
            }
         }
      }
   }
`

export const CART_REWARDS = gql`
   subscription CartRewards($cartId: Int!, $params: jsonb) {
      cartRewards(where: { cartId: { _eq: $cartId } }) {
         reward {
            id
            coupon {
               id
               code
            }
            condition {
               isValid(args: { params: $params })
            }
         }
      }
   }
`

export const ORGANIZATION = gql`
   query organizations {
      organizations {
         id
         stripeAccountId
         stripeAccountType
      }
   }
`

export const REFERRER = gql`
   query customerReferral($brandId: Int!, $code: String!) {
      customerReferrals(
         where: { brandId: { _eq: $brandId }, referralCode: { _eq: $code } }
      ) {
         id
         customer {
            platform_customer: platform_customer_ {
               firstName
               lastName
            }
         }
      }
   }
`

export const WALLETS = gql`
   subscription Wallets($brandId: Int!, $keycloakId: String!) {
      wallets(
         where: { brandId: { _eq: $brandId }, keycloakId: { _eq: $keycloakId } }
      ) {
         amount
         walletTransactions(order_by: { created_at: desc_nulls_last }) {
            id
            type
            amount
            created_at
         }
      }
   }
`

export const LOYALTY_POINTS = gql`
   subscription LoyaltyPoints($brandId: Int!, $keycloakId: String!) {
      loyaltyPoints(
         where: { brandId: { _eq: $brandId }, keycloakId: { _eq: $keycloakId } }
      ) {
         points
         loyaltyPointTransactions(order_by: { created_at: desc_nulls_last }) {
            id
            points
            type
            created_at
         }
      }
   }
`
export const CUSTOMER_REFERRALS = gql`
   subscription CustomerReferrals($brandId: Int!, $keycloakId: String!) {
      customerReferrals(
         where: { brandId: { _eq: $brandId }, keycloakId: { _eq: $keycloakId } }
      ) {
         id
         referralCode
         referredByCode
      }
   }
`

export const CUSTOMERS_REFERRED = gql`
   query CustomersReferred($brandId: Int!, $code: String!) {
      customerReferrals(
         where: { brandId: { _eq: $brandId }, referredByCode: { _eq: $code } }
      ) {
         id
         customer {
            platform_customer: platform_customer_ {
               firstName
               lastName
            }
         }
      }
   }
`

export const SUBSCRIPTION_PLAN = gql`
   query SubscriptionPlan($subscriptionId: Int!, $brandCustomerId: Int) {
      subscription_subscription(
         where: {
            id: { _eq: $subscriptionId }
            brand_customers: { id: { _eq: $brandCustomerId } }
         }
      ) {
         subscriptionItemCount {
            count
            subscriptionServing {
               servingSize
               subscriptionTitle {
                  title
               }
            }
         }
      }
   }
`
export const NAVIGATION_MENU = gql`
   query NAVIGATION_MENU($navigationMenuId: Int!) {
      website_navigationMenuItem(
         where: { navigationMenuId: { _eq: $navigationMenuId } }
      ) {
         created_at
         id
         label
         navigationMenuId
         openInNewTab
         position
         updated_at
         url
         parentNavigationMenuItemId
      }
   }
`
export const WEBSITE_PAGE = gql`
   query WEBSITE_PAGE($domain: String!, $route: String!) {
      website_websitePage(
         where: {
            route: { _eq: $route }
            website: {
               brand: {
                  _or: [
                     { isDefault: { _eq: true } }
                     { domain: { _eq: $domain } }
                  ]
               }
            }
         }
      ) {
         id
         internalPageName
         isArchived
         published
         route
         linkedNavigationMenuId
         websitePageModules(
            order_by: { position: desc_nulls_last }
            where: { isHidden: { _eq: false } }
         ) {
            id
            name
            moduleType
            isHidden
            fileId
            position
            subscriptionDivFileId: file {
               path
               linkedCssFiles {
                  id
                  cssFile {
                     id
                     path
                  }
               }
               linkedJsFiles {
                  id
                  jsFile {
                     id
                     path
                  }
               }
            }
         }
         website {
            navigationMenuId
         }
      }
   }
`

// query MyQuery($navigationMenuId: Int!) {
//    website_navigationMenuItem(
//       where: {
//          navigationMenuId: { _eq: $navigationMenuId }
//          parentNavigationMenuItemId: { _is_null: true }
//       }
//       order_by: { position: desc_nulls_last }
//    ) {
//       id
//       position
//       url
//       label
//       openInNewTab
//       parentNavigationMenuItemId
//       navigationMenuId
//       childNavigationMenuItems(order_by: { position: desc_nulls_last }) {
//          id
//          label
//          navigationMenuId
//          url
//          position
//          parentNavigationMenuItemId
//       }
//    }
// }

export const OTPS = gql`
   subscription otps($where: platform_otp_transaction_bool_exp = {}) {
      otps: platform_otp_transaction(
         where: $where
         order_by: { created_at: desc }
      ) {
         id
         code
         isValid
         validTill
         resendAttempts
         isResendAllowed
      }
   }
`

export const PLATFORM_CUSTOMERS = gql`
   query customers($where: platform_customer__bool_exp = {}) {
      customers: platform_customer_(where: $where) {
         email
         password
         fullName
         id: keycloakId
      }
   }
`
