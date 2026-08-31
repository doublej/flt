#!/usr/bin/env bun
import { mkdir, readFile, readdir, rename } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { ROOT, parseBrief, runBrief } from './run'

const QUEUE = join(ROOT, '.bureau', 'queue')
const DONE = join(ROOT, '.bureau', 'done')

async function runOne(path: string): Promise<void> {
  const brief = parseBrief(JSON.parse(await readFile(path, 'utf-8')))
  console.log(`[${brief.job}] ${brief.from} to ${brief.to} · ${brief.tier}`)
  for await (const update of runBrief(brief)) {
    const { done, total } = update.progress
    console.log(`[${update.job}] ${done}/${total} ${update.state} — ${update.line}`)
  }
}

async function drain(): Promise<void> {
  // One job at a time, on purpose. Searches are throttled to 3s apiece, so a second job
  // in flight would not finish sooner — it would just share the same rate limit and make
  // both customers wait. There is no scheduler here and there does not need to be.
  for (const name of (await readdir(QUEUE)).filter((f) => f.endsWith('.json')).sort()) {
    const path = join(QUEUE, name)
    try {
      await runOne(path)
      await rename(path, join(DONE, name))
    } catch (error) {
      // A brief the harness cannot even parse must not spin forever, and must not vanish
      // into the done pile either — somebody paid for it. Park it in place, visible.
      console.error(`[${name}] ${error instanceof Error ? error.message : String(error)}`)
      await rename(path, `${path}.bad`)
    }
  }
}

const arg = process.argv[2]

if (arg === '--watch') {
  await mkdir(QUEUE, { recursive: true })
  await mkdir(DONE, { recursive: true })
  console.log(`watching ${QUEUE}`)
  for (;;) {
    await drain()
    await new Promise<void>((r) => setTimeout(r, 3000))
  }
} else if (arg) {
  await runOne(resolve(arg))
} else {
  console.error('usage: bun run src/cli.ts <brief.json> | --watch')
  process.exit(1)
}
