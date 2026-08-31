export type Tier = {
  id: string
  name: string
  price: string
  scope: string
  searches: string
  time: string
}

export const TIERS: Tier[] = [
  {
    id: 'enquiry',
    name: 'Enquiry',
    price: '€3',
    scope: 'One route, one date.',
    searches: '1 search',
    time: 'under a minute',
  },
  {
    id: 'flexible',
    name: 'Flexible',
    price: '€5',
    scope: 'One route, up to 9 departure dates.',
    searches: '~9 searches',
    time: '1–2 minutes',
  },
  {
    id: 'survey',
    name: 'Survey',
    price: '€10',
    scope: 'Up to 5 destinations across a date window, economy and premium.',
    searches: '~26 searches',
    time: '3–5 minutes',
  },
]
