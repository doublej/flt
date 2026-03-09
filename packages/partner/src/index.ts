// Types
export type {
  PartnerConfig,
  PartnerFlight,
  PartnerGate,
  PartnerOffer,
  PartnerProposal,
  PartnerSearchParams,
  PartnerSearchResult,
  PartnerSegment,
  PartnerTerm,
} from './types'

// API client
export { startSearch, pollResults, awaitResults, getClickUrl } from './client'

// Flight matching
export { matchProposals, extractOffers } from './match'
