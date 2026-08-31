import type { en } from './i18n/en'

/** What a tier costs and how much searching that buys. The name and the scope
 *  are copy and live in `i18n/en.ts` under the same id; both figures stay here
 *  because a figure a translation can reach is a figure that can be translated
 *  wrong — `briefAmount` parses the price into the cents Stripe charges, and
 *  the tariff sizes its numeral off the count. `en.pricing.searchMark` and
 *  `searchUnit` only say how English writes the count out. */
export type Tier = {
  id: keyof typeof en.pricing.tiers
  price: string
  /** Searches the tier buys. Exact at one, an estimate above it. */
  searches: number
}

export const TIERS: Tier[] = [
  { id: 'enquiry', price: '€3', searches: 1 },
  { id: 'flexible', price: '€5', searches: 9 },
  { id: 'survey', price: '€10', searches: 26 },
]
