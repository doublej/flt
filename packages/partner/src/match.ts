import type { PartnerGate, PartnerOffer, PartnerProposal } from './types'

interface FlightMatch {
  carrier: string
  flightNumber: string
  departureDate: string
}

/** Match a proposal against a specific flight by carrier + flight number + date */
export function matchProposals(
  proposals: PartnerProposal[],
  legs: FlightMatch[],
): PartnerProposal[] {
  return proposals.filter((p) => {
    if (p.segment.length === 0) return false
    // Check first segment's flights match our leg criteria
    const pFlights = p.segment[0].flight
    if (pFlights.length !== legs.length) return false
    return legs.every((leg, i) => {
      const pf = pFlights[i]
      if (!pf) return false
      return (
        pf.operating_carrier === leg.carrier &&
        String(pf.number) === leg.flightNumber &&
        pf.departure_date === leg.departureDate
      )
    })
  })
}

/** Extract cheapest offer per gate from matching proposals */
export function extractOffers(
  matched: PartnerProposal[],
  gates: Record<string, PartnerGate>,
  searchId: string,
): PartnerOffer[] {
  const best = new Map<string, PartnerOffer>()

  for (const p of matched) {
    for (const [gateId, term] of Object.entries(p.terms)) {
      const existing = best.get(gateId)
      if (!existing || term.unified_price < existing.price) {
        const gate = gates[gateId]
        best.set(gateId, {
          gate: gate?.label ?? `Gate ${gateId}`,
          gateId,
          price: term.unified_price,
          currency: term.currency,
          isAirline: gate?.is_airline ?? false,
          bookingUrl: null,
          urlRef: term.url,
          searchId,
        })
      }
    }
  }

  return [...best.values()].sort((a, b) => a.price - b.price)
}
