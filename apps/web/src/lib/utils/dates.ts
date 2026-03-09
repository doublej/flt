export { formatDateShort, parseFlexDate } from '@flights/core/dates'

export function addDays(dateStr: string, days: number): string {
  if (!dateStr || days === 0) return dateStr
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function dateDiff(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
}

export function flexRange(
  center: string,
  before: number,
  after: number,
): { start: string; end?: string } {
  if (before > 0 || after > 0)
    return { start: addDays(center, -before), end: addDays(center, after) }
  return { start: center }
}
