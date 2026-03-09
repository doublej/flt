import type { Offer } from '$lib/types'
import {
  type AffiliateConfig,
  type BookingFilters,
  type ProgramName,
  buildBookingUrls,
  resolveIata,
} from '@flights/core/booking'

export const AFFILIATE: AffiliateConfig = { marker: '709151', trs: '505891' }

export function offerBookingUrls(
  offer: Offer,
  filters?: BookingFilters,
): Record<ProgramName, string> | null {
  const rawFrom = offer.legs[0]?.departure_airport
  const rawTo = offer.legs[offer.legs.length - 1]?.arrival_airport
  if (!rawFrom || !rawTo) return null
  const from = resolveIata(rawFrom)
  const to = resolveIata(rawTo)
  if (!from || !to) return null
  return buildBookingUrls(
    AFFILIATE,
    {
      from_airport: from,
      to_airport: to,
      date: offer.departure_date,
      return_date: offer.return_date ?? undefined,
    },
    filters,
  )
}
