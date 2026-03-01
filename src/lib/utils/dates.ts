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

/** Format "2025-03-15" → "Sat 15 Mar". */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = SHORT_DAYS[new Date(y, m - 1, d).getDay()]
  return `${day} ${d} ${SHORT_MONTHS[m - 1]}`
}
