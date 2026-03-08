import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Offer, SearchEntry, SessionState } from './types'

const SESSION_DIR = join(process.env.TMPDIR ?? '/tmp', 'flt')
const SESSION_FILE = join(SESSION_DIR, 'session.json')

/** Build a cache tag like IAO-MNL@0318 from route + date */
export function routeTag(from: string, to: string, date: string): string {
  const short = date.slice(5).replace('-', '')
  return `${from}-${to}@${short}`
}

export async function saveSession(state: SessionState): Promise<void> {
  await mkdir(SESSION_DIR, { recursive: true })
  await writeFile(SESSION_FILE, JSON.stringify(state, null, 2))
}

export async function loadSession(): Promise<SessionState | null> {
  try {
    const raw = await readFile(SESSION_FILE, 'utf-8')
    return JSON.parse(raw) as SessionState
  } catch {
    return null
  }
}

const THROTTLE_MS = 3000
let lastRequestTime = 0

/** Wait if needed to enforce minimum gap between Google requests */
export async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestTime
  if (lastRequestTime > 0 && elapsed < THROTTLE_MS) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS - elapsed))
  }
  lastRequestTime = Date.now()
}

/** Look up an offer by "TAG:ID" (e.g. "IAO-MNL@0318:O1") or plain "O1" (latest search) */
export function resolveOffer(session: SessionState, ref: string): Offer | null {
  if (ref.includes(':')) {
    const [tag, id] = ref.split(':')
    const entry = session.searches?.[tag.toUpperCase()]
    return entry?.offers.find((o) => o.id === id.toUpperCase()) ?? null
  }
  return session.offers.find((o) => o.id === ref.toUpperCase()) ?? null
}

/** List all available offer refs across all searches */
export function listAvailableRefs(session: SessionState): string[] {
  const refs: string[] = []
  if (session.searches) {
    for (const [tag, entry] of Object.entries(session.searches)) {
      for (const o of entry.offers) refs.push(`${tag}:${o.id}`)
    }
  }
  return refs
}
