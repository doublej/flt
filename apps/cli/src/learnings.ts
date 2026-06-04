/**
 * Shared agent memory — strategies/insights that worked, voted on by agents.
 * Persisted globally (survives sessions) at ~/.config/flt/learnings.json.
 * Local CLI feature; not part of @flights/core.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DIR = join(homedir(), '.config', 'flt')
const FILE = join(DIR, 'learnings.json')

export interface Learning {
  id: string
  text: string
  up: number
  down: number
  created: string
}

/** Net score used for ranking. */
export function learningScore(l: Learning): number {
  return l.up - l.down
}

/** Stable, short id derived from the normalized text — makes adds idempotent. */
function makeId(text: string): string {
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ')
  return `L${createHash('sha1').update(norm).digest('hex').slice(0, 6)}`
}

/** Top learnings by score, then upvotes, then recency. Pure. */
export function topLearnings(list: Learning[], limit: number): Learning[] {
  return [...list]
    .sort(
      (a, b) =>
        learningScore(b) - learningScore(a) || b.up - a.up || b.created.localeCompare(a.created),
    )
    .slice(0, Math.max(0, limit))
}

export async function loadLearnings(): Promise<Learning[]> {
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf-8'))
    return Array.isArray(parsed) ? (parsed as Learning[]) : []
  } catch {
    return []
  }
}

export async function saveLearnings(list: Learning[]): Promise<void> {
  await mkdir(DIR, { recursive: true })
  await writeFile(FILE, `${JSON.stringify(list, null, 2)}\n`)
}

/** Record a learning. Idempotent: same text returns the existing entry. */
export async function addLearning(text: string): Promise<{ learning: Learning; created: boolean }> {
  const clean = text.trim()
  const id = makeId(clean)
  const list = await loadLearnings()
  const existing = list.find((l) => l.id === id)
  if (existing) return { learning: existing, created: false }

  const learning: Learning = { id, text: clean, up: 0, down: 0, created: new Date().toISOString() }
  list.push(learning)
  await saveLearnings(list)
  return { learning, created: true }
}

/** Cast a vote. Returns the updated learning, or null if the id is unknown. */
export async function voteLearning(id: string, dir: 'up' | 'down'): Promise<Learning | null> {
  const list = await loadLearnings()
  const learning = list.find((l) => l.id === id)
  if (!learning) return null
  if (dir === 'up') learning.up++
  else learning.down++
  await saveLearnings(list)
  return learning
}
