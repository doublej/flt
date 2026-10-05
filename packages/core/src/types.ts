export interface Airport {
  name: string
  code: string
  city: string
  country: string
}

export interface FlightLeg {
  airline: string
  airline_name: string
  flight_number: string
  aircraft: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  duration: number
  operator?: string
  seat_pitch?: string
}

export interface FlightLayover {
  airport: string
  airport_name: string
  duration: number
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
  /** The price combines separate tickets (Google's "Separate tickets"); on a trip's outbound row, its cheapest return does. */
  separate_tickets?: boolean
  departure_date: string
  return_date: string | null
  countries: string[]
  legs: FlightLeg[]
  layovers: FlightLayover[]
}

export interface SearchResult {
  current_price: string
  flights: Flight[]
  google_flights_url: string
}

export interface SearchParams {
  from_airport: string
  to_airport: string
  date: string
  return_date?: string
  date_end?: string
  return_date_end?: string
  adults?: number
  children?: number
  infants_in_seat?: number
  infants_on_lap?: number
  seat?: 'economy' | 'premium-economy' | 'business' | 'first'
  max_stops?: number
  currency?: string
}
