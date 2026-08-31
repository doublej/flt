import type { Tier } from './tiers'

/** A paid brief, exactly as it lands in .bureau/queue/<job>.json. The desk on
 *  the other side reads these field names, so they are a contract. */
export type Brief = {
  job: string
  tier: 'enquiry' | 'flexible' | 'survey'
  amount: number
  currency: 'eur'
  email: string
  to: string
  from: string
  month: string
  length: string
  dates: string
  cabin: string
  priorities: string[]
  dislikes: string[]
  dealbreakers: string[]
  notes: string
  paidAt: string
}

/** The half of a brief the customer types. Stripe tells us the rest — who paid,
 *  what they paid and when — so only this half has to survive the round trip. */
export type BriefFields = Omit<Brief, 'job' | 'amount' | 'currency' | 'email' | 'paidAt'>

/** Stripe caps a metadata value at 500 characters and a session at 50 keys. */
const CHUNK = 500
const CHUNKS = 10

/** The brief travels to the webhook inside the session's own metadata, split
 *  across brief0…briefN. The alternative — parking it in a store keyed by job
 *  id — needs somewhere to park it, and a Worker has no memory between the
 *  checkout request and the webhook: the two land in different isolates. */
export function packBrief(fields: BriefFields): Record<string, string> {
  const json = JSON.stringify(fields)
  if (json.length > CHUNK * CHUNKS) throw new Error('brief is too long for Stripe metadata')

  const packed: Record<string, string> = {}
  for (let i = 0; i * CHUNK < json.length; i++) {
    packed[`brief${i}`] = json.slice(i * CHUNK, (i + 1) * CHUNK)
  }
  return packed
}

export function unpackBrief(metadata: Record<string, string>): BriefFields {
  let json = ''
  for (let i = 0; metadata[`brief${i}`] !== undefined; i++) json += metadata[`brief${i}`]
  return JSON.parse(json)
}

/** The price on the tier is display copy ("€10"); Stripe wants cents. Deriving
 *  it here keeps tiers.ts the only place a price is written down. */
export function briefAmount(tier: Tier): number {
  return Math.round(Number.parseFloat(tier.price.replace(/[^\d.]/g, '')) * 100)
}

/** Four hex characters, the short form the status page and the desk expect. */
export function newJob(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(2)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}
