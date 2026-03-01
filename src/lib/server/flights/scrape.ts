/**
 * Google Flights scraper — ports fast-flights core.py js data_source mode.
 * Extracts JSON from <script class="ds:1"> using HTMLRewriter, then decodes
 * the nested array structure via decode.ts.
 */

import { extractDataArray, decodeResult, type DecodedFlight } from './decode'

const CHROME_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
  Cookie: 'CONSENT=PENDING+987; SOCS=CAESHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzIaAmRlIAEaBgiAo_CmBg',
}

export interface ScrapeResult {
  flights: DecodedFlight[]
  blocked: boolean
}

export async function fetchFlights(b64: string, currency: string): Promise<ScrapeResult> {
  const params = new URLSearchParams({ tfs: b64, hl: 'en', tfu: 'EgQIABABIgA', curr: currency })

  const res = await fetch(`https://www.google.com/travel/flights?${params}`, {
    headers: CHROME_HEADERS,
  })

  if (!res.ok) return { flights: [], blocked: true }

  // Extract <script class="ds:1"> text via HTMLRewriter
  let scriptText = ''
  const rewriter = new HTMLRewriter()
  rewriter.on('script[class="ds:1"]', {
    text(chunk: TextChunk) {
      scriptText += chunk.text
    },
  })
  await rewriter.transform(res).text()

  if (!scriptText) return { flights: [], blocked: true }

  const data = extractDataArray(scriptText)
  if (!data) return { flights: [], blocked: true }

  const flights = decodeResult(data)
  return { flights, blocked: flights.length === 0 }
}

export function buildGoogleFlightsUrl(b64: string, currency: string): string {
  const params = new URLSearchParams({ tfs: b64, hl: 'en', curr: currency })
  return `https://www.google.com/travel/flights?${params}`
}
