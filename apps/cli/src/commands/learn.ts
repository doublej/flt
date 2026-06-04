import { defineCommand } from 'citty'
import {
  type Learning,
  addLearning,
  learningScore,
  loadLearnings,
  topLearnings,
  voteLearning,
} from '../learnings'

/** Signed score, e.g. +4, 0, -2. */
export function fmtScore(l: Learning): string {
  const s = learningScore(l)
  return s > 0 ? `+${s}` : `${s}`
}

export const learnCommand = defineCommand({
  meta: { name: 'learn', description: 'Record a flight-search learning for future agents' },
  args: {
    text: {
      type: 'positional',
      description: 'The learning, e.g. "Tue/Wed departures ~15% cheaper on longhaul"',
      required: false,
    },
  },
  async run({ args }) {
    // Capture the full phrase whether quoted (one token) or unquoted (many).
    const parts = Array.isArray(args._) ? (args._ as string[]) : []
    const text = (parts.length ? parts.join(' ') : String(args.text ?? '')).trim()
    if (!text) {
      console.log(JSON.stringify({ err: 'EMPTY', hint: 'flt learn "the strategy that worked"' }))
      return
    }

    const { learning, created } = await addLearning(text)
    console.log(
      JSON.stringify({
        ok: true,
        id: learning.id,
        created,
        score: learningScore(learning),
        text: learning.text,
      }),
    )
  },
})

export const voteCommand = defineCommand({
  meta: { name: 'vote', description: 'Vote up or down on a learning (see `flt learnings`)' },
  args: {
    id: { type: 'positional', description: 'Learning ID (e.g. La1b2c3)', required: true },
    dir: { type: 'positional', description: 'up or down', required: true },
  },
  async run({ args }) {
    const dir = String(args.dir).toLowerCase()
    if (dir !== 'up' && dir !== 'down') {
      console.log(JSON.stringify({ err: 'BAD_DIR', hint: 'Use `up` or `down`.' }))
      return
    }

    const learning = await voteLearning(args.id, dir)
    if (!learning) {
      console.log(
        JSON.stringify({ err: 'NOT_FOUND', hint: `No learning '${args.id}'. Run \`flt learnings\`.` }),
      )
      return
    }

    console.log(
      JSON.stringify({
        ok: true,
        id: learning.id,
        score: learningScore(learning),
        up: learning.up,
        down: learning.down,
      }),
    )
  },
})

export const learningsCommand = defineCommand({
  meta: { name: 'learnings', description: 'List top flight-search learnings by vote score' },
  args: {
    limit: { type: 'string', description: 'Max learnings to show (default 10)', default: '10' },
    fmt: { type: 'string', description: 'Output format: table|jsonl', default: 'table' },
  },
  async run({ args }) {
    const all = await loadLearnings()
    if (!all.length) {
      console.log('No learnings yet. Add one with `flt learn "..."`.')
      return
    }

    const limit = Number.parseInt(args.limit, 10) || 10
    const top = topLearnings(all, limit)

    if (args.fmt === 'jsonl') {
      for (const l of top) {
        console.log(
          JSON.stringify({ id: l.id, score: learningScore(l), up: l.up, down: l.down, text: l.text }),
        )
      }
      return
    }

    const idW = Math.max(2, ...top.map((l) => l.id.length))
    const scW = Math.max(5, ...top.map((l) => fmtScore(l).length))
    const lines = top.map(
      (l, i) =>
        `  ${String(i + 1).padStart(2)}  ${l.id.padEnd(idW)}  ${fmtScore(l).padStart(scW)}  ${l.text}`,
    )
    console.log(`  ${'#'.padStart(2)}  ${'ID'.padEnd(idW)}  ${'SCORE'.padStart(scW)}  LEARNING`)
    console.log(lines.join('\n'))
    console.error(`\n  ${all.length} learning${all.length !== 1 ? 's' : ''} total`)
  },
})
