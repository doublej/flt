export interface Airport {
  name: string
  code: string
  city: string
  country: string
}

export interface Flight {
  is_best: boolean
  name: string
  departure: string
  arrival: string
  arrival_time_ahead: string
  duration: string
  stops: number
  delay: string | null
  price: string
}

export interface SearchResult {
  current_price: string
  flights: Flight[]
}

export interface SearchParams {
  from_airport: string
  to_airport: string
  date: string
  return_date?: string
  adults?: number
  children?: number
  infants_in_seat?: number
  infants_on_lap?: number
  seat?: string
  max_stops?: number
  currency?: string
}
