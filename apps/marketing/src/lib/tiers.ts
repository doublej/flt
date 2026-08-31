import type { en } from './i18n/en'

/** What a tier costs and nothing else. The name, the scope and the search count
 *  are copy and live in `i18n/en.ts` under the same id; the price stays here
 *  because `briefAmount` parses it into the cents Stripe charges, and a figure
 *  a translation can reach is a figure that can be translated wrong. */
export type Tier = {
  id: keyof typeof en.pricing.tiers
  price: string
}

export const TIERS: Tier[] = [
  { id: 'enquiry', price: '€3' },
  { id: 'flexible', price: '€5' },
  { id: 'survey', price: '€10' },
]
