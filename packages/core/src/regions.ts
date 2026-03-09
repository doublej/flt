/** Geographic hub groups for --exclude-region. */
const REGIONS: Record<string, string[]> = {
  gulf: ['DXB', 'DOH', 'AUH', 'BAH', 'MCT', 'KWI'],
  russia: ['SVO', 'DME', 'LED', 'VKO'],
  belarus: ['MSQ'],
}

/** Resolve comma-separated mix of region names and IATA codes → deduplicated IATA codes. */
export function resolveRegions(input: string): string[] {
  const codes: string[] = []
  for (const token of input.split(',').map((s) => s.trim().toLowerCase())) {
    const region = REGIONS[token]
    if (region) codes.push(...region)
    else codes.push(token.toUpperCase())
  }
  return [...new Set(codes)]
}

/** Merge --exclude-hub and --exclude-region into a single comma-separated string. */
export function mergeExclusions(hub?: string, region?: string): string | undefined {
  if (!hub && !region) return undefined
  const codes: string[] = []
  if (hub) codes.push(...hub.split(',').map((s) => s.trim().toUpperCase()))
  if (region) codes.push(...resolveRegions(region))
  return [...new Set(codes)].join(',') || undefined
}

/** List available region names and their airports. */
export function listRegions(): Record<string, readonly string[]> {
  return Object.fromEntries(Object.entries(REGIONS).map(([k, v]) => [k, [...v]]))
}
