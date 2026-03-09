import type { PartnerConfig, PartnerProposal, PartnerGate, PartnerSearchParams, PartnerSearchResult } from './types'
import { buildSignature } from './sign'

const API_BASE = 'https://api.travelpayouts.com'
const POLL_INTERVAL_MS = 1000
const MAX_POLLS = 30

function buildRequestBody(
  config: PartnerConfig,
  params: PartnerSearchParams,
  userIp: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    marker: config.marker,
    host: config.host,
    user_ip: userIp,
    locale: params.locale ?? 'en',
    trip_class: params.tripClass,
    passengers: params.passengers,
    segments: params.segments,
    know_english: 'true',
    currency: params.currency ?? 'usd',
  }
  body.signature = buildSignature(config.token, body)
  return body
}

export async function startSearch(
  config: PartnerConfig,
  params: PartnerSearchParams,
  userIp: string,
): Promise<string> {
  const body = buildRequestBody(config, params, userIp)
  const res = await fetch(`${API_BASE}/v1/flight_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': config.token,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Partner search failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { search_id: string }
  return data.search_id
}

export async function pollResults(searchId: string): Promise<PartnerSearchResult> {
  const res = await fetch(`${API_BASE}/v1/flight_search_results?uuid=${searchId}`)
  if (!res.ok) throw new Error(`Partner poll failed (${res.status})`)

  const items = (await res.json()) as Array<Record<string, unknown>>

  // Done when last element has only search_id
  const last = items[items.length - 1]
  const done = last != null && Object.keys(last).length === 1 && 'search_id' in last

  // Merge all chunks
  const proposals: PartnerProposal[] = []
  const gates: Record<string, PartnerGate> = {}
  const airlines: Record<string, { name: string; alliance_name?: string }> = {}

  for (const item of items) {
    if (item.proposals) proposals.push(...(item.proposals as PartnerProposal[]))
    if (item.gates_info) Object.assign(gates, item.gates_info)
    if (item.airlines) Object.assign(airlines, item.airlines)
  }

  return { searchId, proposals, gates, airlines, done }
}

/** Poll until all gates have responded or timeout */
export async function awaitResults(searchId: string): Promise<PartnerSearchResult> {
  let result: PartnerSearchResult = { searchId, proposals: [], gates: {}, airlines: {}, done: false }

  for (let i = 0; i < MAX_POLLS; i++) {
    result = await pollResults(searchId)
    if (result.done) break
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }

  return result
}

/** Resolve a deep-link booking URL from a search result */
export async function getClickUrl(
  searchId: string,
  urlRef: number,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/v1/flight_searches/${searchId}/clicks/${urlRef}.json`,
  )
  if (!res.ok) throw new Error(`Click URL failed (${res.status})`)
  const data = (await res.json()) as { url: string }
  return data.url
}
