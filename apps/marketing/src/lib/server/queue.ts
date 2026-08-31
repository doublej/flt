import { dev } from '$app/environment'
import type { Brief } from '$lib/brief'

/** Repo root, five levels up from src/lib/server/. Only read in dev. */
const QUEUE = new URL('../../../../../.bureau/queue/', import.meta.url)

/** Hands a paid brief to the desk, which watches .bureau/queue for new files. */
export async function enqueueBrief(brief: Brief): Promise<void> {
  // ponytail: a directory on disk is the whole queue, which works because dev
  // runs in Node. A Worker has no filesystem, so before this goes live the
  // deployed path needs real persistence — CF Queues, or KV the desk polls.
  if (!dev) {
    console.log(`paid brief ${brief.job} (${brief.tier}) — no production queue on this deployment`)
    return
  }

  const { mkdir, writeFile } = await import('node:fs/promises')
  await mkdir(QUEUE, { recursive: true })
  await writeFile(new URL(`${brief.job}.json`, QUEUE), `${JSON.stringify(brief, null, 2)}\n`)
}
