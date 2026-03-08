const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/
const DMY_SLASH = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
const RELATIVE: Record<string, number> = { today: 0, tomorrow: 1, overmorrow: 2 }

/** Parse flexible date input → "YYYY-MM-DD". Returns null on invalid. */
export function parseFlexDate(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  if (trimmed in RELATIVE) {
    const d = new Date()
    d.setDate(d.getDate() + RELATIVE[trimmed])
    return d.toISOString().slice(0, 10)
  }
  if (ISO_RE.test(trimmed)) {
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? null : trimmed
  }
  const m = trimmed.match(DMY_SLASH)
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : iso
  }
  return null
}

/** Format "2025-03-15" → "Sat 15 Mar". */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = SHORT_DAYS[new Date(y, m - 1, d).getDay()]
  return `${day} ${d} ${SHORT_MONTHS[m - 1]}`
}
