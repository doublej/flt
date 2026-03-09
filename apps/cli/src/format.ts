import type { Format, Offer, View } from './types'
import { DEFAULT_FIELDS, VIEW_FIELDS } from './types'

type FieldGetter = (o: Offer) => string

const FIELD_MAP: Record<string, FieldGetter> = {
  id: (o) => o.id,
  price: (o) => o.price,
  stops: (o) => String(o.stops),
  dur: (o) => o.duration,
  car: (o) => o.name,
  dep: (o) => (o.departure === '??:??' ? '—' : o.departure),
  arr: (o) => (o.arrival === '??:??' ? '—' : o.arrival),
  date: (o) => o.departure_date,
  best: (o) => (o.is_best ? 'yes' : ''),
  ret: (o) => o.return_date ?? '',
  ahead: (o) => o.arrival_time_ahead,
  url: (o) => o.url,
  flt_no: (o) => o.legs.map((l) => l.flight_number).join('/') || '',
}

function resolveFields(fields?: string, view?: View): string[] {
  const raw = fields ?? VIEW_FIELDS[view ?? 'std'] ?? DEFAULT_FIELDS
  return raw.split(',').filter((f) => f in FIELD_MAP)
}

function getRow(o: Offer, fields: string[]): Record<string, string> {
  const row: Record<string, string> = {}
  for (const f of fields) row[f] = FIELD_MAP[f]?.(o) ?? ''
  return row
}

function stopsLabel(n: number): string {
  if (n === 0) return 'direct'
  return `${n} stop${n > 1 ? 's' : ''}`
}

export function formatOffers(offers: Offer[], fmt: Format, fields?: string, view?: View): string {
  const cols = resolveFields(fields, view)

  switch (fmt) {
    case 'jsonl':
      return offers.map((o) => JSON.stringify(getRow(o, cols))).join('\n')

    case 'tsv': {
      const header = cols.join('\t')
      const rows = offers.map((o) => cols.map((f) => FIELD_MAP[f]?.(o) ?? '').join('\t'))
      return [header, ...rows].join('\n')
    }

    case 'table': {
      const rows = offers.map((o) => getRow(o, cols))
      const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => (r[c] ?? '').length)))
      const header = cols.map((c, i) => c.padEnd(widths[i])).join('  ')
      const lines = rows.map((r) => cols.map((c, i) => (r[c] ?? '').padEnd(widths[i])).join('  '))
      return [header, ...lines].join('\n')
    }

    case 'brief':
      return offers
        .map(
          (o) =>
            `${o.id} ${o.price} ${o.name} ${stopsLabel(o.stops)} ${o.duration} ${o.departure_date} ${o.departure === '??:??' ? '—' : o.departure}→${o.arrival === '??:??' ? '—' : o.arrival}${o.arrival_time_ahead}`,
        )
        .join('\n')
  }
}

export function formatError(err: string, hint: string, url?: string): string {
  const obj: Record<string, string> = { err, hint }
  if (url) obj.url = url
  return JSON.stringify(obj)
}
