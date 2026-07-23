import { airportCity } from '@flights/core'

const IATA_RE = /\b([A-Z]{3})\b/g

/** Extract all 3-letter uppercase codes that are valid IATA airports from text */
export function collectCodes(text: string): string[] {
  const codes = new Set<string>()
  for (const [, code] of text.matchAll(IATA_RE)) {
    if (airportCity(code)) codes.add(code)
  }
  return [...codes].sort()
}

/** Format a legend line from collected IATA codes */
export function formatLegend(codes: string[]): string {
  if (!codes.length) return ''
  return codes.map((c) => `${c} = ${airportCity(c)}`).join(', ')
}

/** Print output with an airport legend prepended */
export function printWithLegend(output: string): void {
  const codes = collectCodes(output)
  if (codes.length) console.log(`  ${formatLegend(codes)}\n`)
  console.log(output)
}
