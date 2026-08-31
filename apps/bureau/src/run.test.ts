import { readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'
import {
  type Ask,
  ROOT,
  budgetFor,
  parseAttention,
  parseBrief,
  parseProgress,
  runBrief,
  writeStatus,
} from './run'
import type { Brief, Job } from './types'

const BRIEF: Brief = {
  job: 'ffff',
  tier: 'survey',
  amount: 1000,
  currency: 'eur',
  email: 'someone@example.com',
  to: 'Vietnam',
  from: 'Amsterdam',
  month: 'November',
  length: 'A week',
  dates: 'Give or take a few days',
  cabin: 'Economy',
  priorities: ['price', 'short layovers'],
  dislikes: ['red-eyes'],
  dealbreakers: [],
  notes: 'Can train to Brussels.',
  paidAt: '2026-08-30T20:00:00Z',
}

const STATUS_FILE = join(ROOT, 'apps', 'marketing', 'static', 'status', `${BRIEF.job}.json`)
const PDF_FILE = join(ROOT, 'apps', 'marketing', 'static', 'report', `${BRIEF.job}.pdf`)

/** A stand-in for the three agents, so the pipeline runs with no API key and no scrape. */
function stub(script: { desk: string; progress?: string[]; line?: string }): Ask {
  return async (agent, _prompt, onText) => {
    if (agent === 'bureau-desk') return script.desk
    if (agent === 'bureau-back-office') {
      for (const text of script.progress ?? []) onText?.(text)
      return 'Four routes, eleven options.'
    }
    return script.line ?? 'Bangkok and Singapore are in.'
  }
}

const PLAN = JSON.stringify({
  route: 'Amsterdam to Vietnam',
  plan: 'AMS to HAN, SGN, BKK and SIN across the first half of November.',
  blocker: null,
})

async function collect(ask: Ask): Promise<Job[]> {
  const updates: Job[] = []
  for await (const update of runBrief(BRIEF, ask)) updates.push(update)
  return updates
}

async function cleanup(): Promise<void> {
  await rm(STATUS_FILE, { force: true })
  await rm(PDF_FILE, { force: true })
}

describe('parseBrief', () => {
  test('accepts a paid brief and keeps every field', () => {
    expect(parseBrief(JSON.parse(JSON.stringify(BRIEF)))).toEqual(BRIEF)
  })

  test('rejects the shapes that would break the status URL or the budget', () => {
    expect(() => parseBrief(null)).toThrow('JSON object')
    expect(() => parseBrief({ ...BRIEF, job: 'nope!' })).toThrow('4 hex chars')
    expect(() => parseBrief({ ...BRIEF, tier: 'deluxe' })).toThrow('brief.tier')
    expect(() => parseBrief({ ...BRIEF, amount: 0 })).toThrow('brief.amount')
    expect(() => parseBrief({ ...BRIEF, currency: 'usd' })).toThrow('brief.currency')
    expect(() => parseBrief({ ...BRIEF, priorities: 'price' })).toThrow('array of strings')
  })

  test('lets vague prose through — judging it is the desk’s job, not the parser’s', () => {
    expect(parseBrief({ ...BRIEF, month: '', dates: '', notes: '' }).month).toBe('')
  })
})

describe('budgetFor', () => {
  test('matches the tiers the marketing site sells', () => {
    expect(budgetFor('enquiry')).toBe(1)
    expect(budgetFor('flexible')).toBe(9)
    expect(budgetFor('survey')).toBe(26)
  })
})

describe('back office markers', () => {
  test('reads the newest report in a turn, not the oldest', () => {
    const text = 'PROGRESS 3/26 Bangkok going\nsome chatter\nPROGRESS 7/26 Bangkok in, Hanoi now'
    expect(parseProgress(text)).toEqual({ done: 7, total: 26, note: 'Bangkok in, Hanoi now' })
  })

  test('ignores prose that only mentions progress', () => {
    expect(parseProgress('I will report progress as 3/26 when done.')).toBe(null)
    expect(parseAttention('ATTENTION Hanoi comes back empty')).toBe('Hanoi comes back empty')
  })
})

describe('writeStatus', () => {
  test('writes the exact shape the status page polls for', async () => {
    const dir = join(tmpdir(), `bureau-${Math.random().toString(16).slice(2)}`)
    const job: Job = {
      job: 'b7f3',
      route: 'Amsterdam to Vietnam',
      tier: 'Survey',
      updated: '2026-08-30T20:40:00Z',
      state: 'working',
      progress: { done: 14, total: 26 },
      line: 'Bangkok and Singapore are in.',
      pdf: null,
    }
    await writeStatus(job, dir)
    expect(JSON.parse(await readFile(join(dir, 'b7f3.json'), 'utf-8'))).toEqual(job)
    await rm(dir, { recursive: true, force: true })
  })
})

describe('runBrief', () => {
  test('streams the counts the back office reported and finishes ready on a real PDF', async () => {
    await cleanup()
    await writeFile(PDF_FILE, 'not really a pdf', 'utf-8')

    const updates = await collect(
      stub({ desk: PLAN, progress: ['PROGRESS 7/26 Bangkok in', 'PROGRESS 26/26 all four in'] }),
    )

    expect(updates.map((u) => `${u.progress.done}/${u.progress.total} ${u.state}`)).toEqual([
      '0/26 working',
      '7/26 working',
      '26/26 working',
      '26/26 ready',
    ])
    const last = updates[updates.length - 1]
    expect(last.pdf).toBe('/report/ffff.pdf')
    expect(last.route).toBe('Amsterdam to Vietnam')
    // The line is the status writer's, pasted through untouched.
    expect(last.line).toBe('Bangkok and Singapore are in.')
    expect(JSON.parse(await readFile(STATUS_FILE, 'utf-8'))).toEqual(last)

    await cleanup()
  })

  test('a run that produces no PDF ends in attention, never a stale working', async () => {
    await cleanup()

    const updates = await collect(stub({ desk: PLAN, progress: ['PROGRESS 4/26 Hanoi empty'] }))
    const last = updates[updates.length - 1]

    expect(last.state).toBe('attention')
    expect(last.pdf).toBe(null)
    expect(JSON.parse(await readFile(STATUS_FILE, 'utf-8')).state).toBe('attention')

    await cleanup()
  })

  test('a desk blocker stops the job before a single search is paid for', async () => {
    await cleanup()
    let reachedBackOffice = false

    const ask: Ask = async (agent) => {
      if (agent === 'bureau-desk') return JSON.stringify({ route: 'Nowhere', blocker: 'no origin' })
      if (agent === 'bureau-back-office') {
        reachedBackOffice = true
        return ''
      }
      return 'We cannot place your origin, so nothing is running yet.'
    }

    const updates = await collect(ask)

    expect(reachedBackOffice).toBe(false)
    expect(updates.length).toBe(1)
    expect(updates[0].state).toBe('attention')
    expect(updates[0].route).toBe('Nowhere')

    await cleanup()
  })

  test('a back office that dies mid-run still leaves a truthful file', async () => {
    await cleanup()

    const ask: Ask = async (agent, _prompt, onText) => {
      if (agent === 'bureau-desk') return PLAN
      if (agent === 'bureau-back-office') {
        onText?.('PROGRESS 5/26 Bangkok in')
        throw new Error('rate limited for the fourth time')
      }
      return 'Still working.'
    }

    const updates = await collect(ask)
    const last = updates[updates.length - 1]

    expect(last.state).toBe('attention')
    expect(JSON.parse(await readFile(STATUS_FILE, 'utf-8')).state).toBe('attention')

    await cleanup()
  })
})
