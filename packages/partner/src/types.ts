export interface PartnerConfig {
  token: string
  marker: string
  host: string
}

export interface PartnerSegment {
  origin: string
  destination: string
  date: string
}

export interface PartnerSearchParams {
  segments: PartnerSegment[]
  passengers: { adults: number; children: number; infants: number }
  tripClass: 'Y' | 'C'
  currency?: string
  locale?: string
}

/** Single flight within a proposal segment */
export interface PartnerFlight {
  number: number
  operating_carrier: string
  aircraft: string
  departure: string
  arrival: string
  departure_date: string
  arrival_date: string
  departure_time: string
  arrival_time: string
  duration: number
  delay: number
}

export interface PartnerTerm {
  currency: string
  price: number
  unified_price: number
  url: number
}

export interface PartnerProposal {
  sign: string
  terms: Record<string, PartnerTerm>
  segment: Array<{ flight: PartnerFlight[] }>
}

export interface PartnerGate {
  label: string
  is_airline: boolean
  currency_code: string
  average_rate: number
}

export interface PartnerSearchResult {
  searchId: string
  proposals: PartnerProposal[]
  gates: Record<string, PartnerGate>
  airlines: Record<string, { name: string; alliance_name?: string }>
  done: boolean
}

/** A matched partner offer with price + deep link */
export interface PartnerOffer {
  gate: string
  gateId: string
  price: number
  currency: string
  isAirline: boolean
  /** Populated by getClickUrl() — null until fetched */
  bookingUrl: string | null
  /** Raw ref for clicks endpoint */
  urlRef: number
  searchId: string
}
