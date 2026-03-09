import type { Offer, SearchQuery, SessionState, FltConfig } from '@flights/core'

export interface AppState {
  flights: Offer[]
  rawFlights: Offer[]
  lastQuery: SearchQuery | null
  lastRef: string | null
  session: SessionState
  config: FltConfig
  currency: string
}

export const flags = { busy: false }
