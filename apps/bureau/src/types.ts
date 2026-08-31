/**
 * A paid brief, as the checkout writes it to `.bureau/queue/<job>.json`.
 *
 * Almost every field is prose a customer typed, not a code the engine understands.
 * "Vietnam" is not an IATA code and "a week in November" is not a date range; turning
 * one into the other is the desk's job, which is why this pipeline runs through a model
 * and not a parser.
 */
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

/**
 * The status file at `apps/marketing/static/status/<job>.json`. The shape is fixed by
 * `apps/marketing/src/routes/status/+page.svelte`, which polls it every five seconds —
 * change one and you must change the other.
 */
export type Job = {
  job: string
  route: string
  tier: string
  updated: string
  state: 'working' | 'ready' | 'attention'
  progress: { done: number; total: number }
  line: string
  pdf: string | null
}

/**
 * What `runBrief` yields. Every update is the status snapshot exactly as it was just
 * written to disk, so a caller that wants to show progress can render the yield and a
 * caller that does not can ignore it — there is nothing to reassemble either way.
 */
export type Update = Job
