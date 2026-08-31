import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { Brief, Job, Update } from './types'

export const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const AGENT_DIR = join(ROOT, '.claude', 'agents')
const STATUS_DIR = join(ROOT, 'apps', 'marketing', 'static', 'status')
const REPORT_DIR = join(ROOT, 'apps', 'marketing', 'static', 'report')

/**
 * Search budget per tier. The numbers live in three places already — the prices in
 * `apps/marketing/src/lib/tiers.ts`, the table in `.claude/agents/bureau-back-office.md`,
 * and here — but only this copy is a number a program can spend, so it is the one the
 * harness enforces.
 */
const BUDGET: Record<Brief['tier'], number> = { enquiry: 1, flexible: 9, survey: 26 }

export function budgetFor(tier: Brief['tier']): number {
  return BUDGET[tier]
}

// --- the brief on the wire ------------------------------------------------------------

const TIERS: Brief['tier'][] = ['enquiry', 'flexible', 'survey']

function str(o: Record<string, unknown>, key: string): string {
  const v = o[key]
  if (typeof v !== 'string') throw new Error(`brief.${key} must be a string`)
  return v
}

function required(o: Record<string, unknown>, key: string): string {
  const v = str(o, key)
  if (v.trim() === '') throw new Error(`brief.${key} must not be empty`)
  return v
}

function strings(o: Record<string, unknown>, key: string): string[] {
  const v = o[key]
  if (!Array.isArray(v) || v.some((e) => typeof e !== 'string'))
    throw new Error(`brief.${key} must be an array of strings`)
  return v as string[]
}

/**
 * Validate the shape of a queued brief, and only the shape. Whether "November" is a
 * usable date window or "Vietnam" a reachable destination is a judgement the desk makes;
 * a parser that tried would be guessing. What is checked here is the structural part a
 * wrong answer to would be a bug rather than a vague customer: the job id the status URL
 * is built from, the tier the budget comes from, and the money.
 */
export function parseBrief(raw: unknown): Brief {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    throw new Error('brief must be a JSON object')
  const o = raw as Record<string, unknown>

  const job = required(o, 'job')
  if (!/^[0-9a-f]{4}$/.test(job)) throw new Error(`brief.job must be 4 hex chars, got '${job}'`)

  const tier = required(o, 'tier') as Brief['tier']
  if (!TIERS.includes(tier)) throw new Error(`brief.tier must be one of ${TIERS.join(', ')}`)

  const amount = o.amount
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0)
    throw new Error('brief.amount must be a positive integer of cents')

  if (o.currency !== 'eur') throw new Error("brief.currency must be 'eur'")

  return {
    job,
    tier,
    amount,
    currency: 'eur',
    email: required(o, 'email'),
    to: required(o, 'to'),
    from: required(o, 'from'),
    month: str(o, 'month'),
    length: str(o, 'length'),
    dates: str(o, 'dates'),
    cabin: str(o, 'cabin'),
    priorities: strings(o, 'priorities'),
    dislikes: strings(o, 'dislikes'),
    dealbreakers: strings(o, 'dealbreakers'),
    notes: str(o, 'notes'),
    paidAt: required(o, 'paidAt'),
  }
}

// --- the status file ------------------------------------------------------------------

export async function writeStatus(job: Job, dir: string = STATUS_DIR): Promise<Job> {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${job.job}.json`), `${JSON.stringify(job, null, 2)}\n`, 'utf-8')
  return job
}

// --- what the back office reports -------------------------------------------------------

export type Report = { done: number; total: number; note: string }

/**
 * The back office reports progress as marker lines in its own output rather than through
 * a tool. Two reasons: the numbers stay the back office's own claim, which is exactly
 * what the status contract asks for ("facts you take from what the back office actually
 * reported"), and a marker costs nothing to bolt onto a system prompt this app does not
 * own. Both readers take the *last* match, because one assistant turn can carry several
 * and only the newest is still true.
 */
const PROGRESS = /^\s*PROGRESS\s+(\d+)\s*\/\s*(\d+)\s*(.*)$/gm
const ATTENTION = /^\s*ATTENTION\s+(.+)$/gm

function lastMatch(re: RegExp, text: string): RegExpMatchArray | null {
  const all = [...text.matchAll(re)]
  return all.length ? all[all.length - 1] : null
}

export function parseProgress(text: string): Report | null {
  const m = lastMatch(PROGRESS, text)
  if (!m) return null
  const total = Number(m[2])
  return { done: Number(m[1]), total: total > 0 ? total : 1, note: m[3].trim() }
}

export function parseAttention(text: string): string | null {
  return lastMatch(ATTENTION, text)?.[1].trim() ?? null
}

// --- talking to the three agents --------------------------------------------------------

export type AgentName = 'bureau-desk' | 'bureau-back-office' | 'bureau-status'

/**
 * The one seam in this harness. Everything that reaches the Agent SDK goes through here,
 * so a test can drive the whole pipeline without an API key, a scrape, or a bill.
 */
export type Ask = (
  agent: AgentName,
  prompt: string,
  onText?: (text: string) => void,
) => Promise<string>

/**
 * Read a role's system prompt out of `.claude/agents/<name>.md`. The three roles are
 * already specified there for Claude Code, down to the model each one runs on; copying
 * them into this file would mean two versions of the same instructions drifting apart.
 */
async function readAgent(name: AgentName): Promise<{
  model: string
  effort: string | undefined
  prompt: string
}> {
  const raw = await readFile(join(AGENT_DIR, `${name}.md`), 'utf-8')
  const parts = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!parts) throw new Error(`${name}.md has no frontmatter`)
  return {
    model: parts[1].match(/^model:\s*(\S+)/m)?.[1] ?? 'sonnet',
    effort: parts[1].match(/^reasoning_effort:\s*(\S+)/m)?.[1],
    prompt: parts[2].trim(),
  }
}

export const askViaSdk: Ask = async (name, prompt, onText) => {
  const agent = await readAgent(name)
  // Only the back office touches the machine. The desk routes and the status writer
  // writes one sentence; handing either of them a shell is how a router starts
  // researching and a copywriter starts inventing fares.
  const tooled = name === 'bureau-back-office'

  const q = query({
    prompt,
    options: {
      cwd: ROOT,
      model: agent.model,
      ...(agent.effort ? { effort: agent.effort as 'xhigh' } : {}),
      // The back office keeps the Claude Code preset because it drives a CLI and needs
      // the tool discipline that comes with it. The other two get their role prompt and
      // nothing else, which keeps them cheap and on topic.
      systemPrompt: tooled
        ? { type: 'preset' as const, preset: 'claude_code' as const, append: agent.prompt }
        : agent.prompt,
      allowedTools: tooled ? ['Bash', 'Read', 'Glob', 'Grep'] : [],
      permissionMode: tooled ? ('bypassPermissions' as const) : ('default' as const),
      // 'project' pulls in the repo's CLAUDE.md, which is where `just flt` is documented.
      settingSources: tooled ? (['project'] as const) : [],
      // A hard ceiling on turns is the cheapest guard against a loop. The back office
      // needs room for one turn per search plus planning; the other two answer once.
      maxTurns: tooled ? 150 : 4,
      // And a ceiling in money, because turns are not all the same size and an Opus run
      // at xhigh that goes wrong should stop before it costs more than the tier sold for.
      ...(tooled ? { maxBudgetUsd: 5 } : {}),
    },
  })

  let result = ''
  for await (const message of q) {
    if (message.type === 'assistant') {
      for (const block of message.message.content) {
        if (block.type === 'text') onText?.(block.text)
      }
    }
    if (message.type === 'result') {
      if (message.subtype !== 'success') throw new Error(`${name} ended: ${message.subtype}`)
      result = message.result
    }
  }
  return result
}

// --- prompts ----------------------------------------------------------------------------

/**
 * The desk's file tells it to reach its peers with SendMessage and to write the status
 * file itself. Neither is available to a subagent driven from a program, so the harness
 * says so plainly and takes over as the transport. The routing is unchanged — the desk
 * still never researches, the back office still never sees the customer — only the wire
 * between them is different.
 */
function deskPrompt(brief: Brief, budget: number): string {
  return [
    'You are being run by the Bureau harness rather than by a human operator. There is no',
    'SendMessage in this run: the harness carries every message between you, the back',
    'office and the status writer, and the harness writes the status file from what you',
    'and the back office report. Everything else about your role is unchanged.',
    '',
    'Here is a paid brief. Sanity-check it and turn it into a plan the back office can run.',
    '',
    JSON.stringify(brief, null, 2),
    '',
    `The ${brief.tier} tier buys about ${budget} searches. The engine caps one command at`,
    '21 searches over a 7-day window, so a plan needing more than that must be split.',
    '',
    'Reply with one JSON object and nothing else:',
    '{',
    '  "route": "<the one line the customer sees, e.g. Amsterdam to Vietnam>",',
    '  "plan": "<what the back office should search: origins, destinations, date windows,',
    '            cabins, and how the search budget is split across them>",',
    '  "blocker": "<why this brief cannot be run as sold, or null>"',
    '}',
  ].join('\n')
}

function backOfficePrompt(brief: Brief, route: string, plan: string, budget: number): string {
  return [
    'The desk has cleared this brief. Run it.',
    '',
    `Job ${brief.job} · ${brief.tier} tier · ${route}`,
    `Search budget: about ${budget} searches. Do not exceed it.`,
    '',
    'The plan:',
    plan,
    '',
    'The customer brief, verbatim, for the detail the plan leaves out:',
    JSON.stringify(brief, null, 2),
    '',
    'The Task tool is not available in this run, so run every route yourself, one after',
    'another. The 3s throttle means that is the right shape anyway — parallel scrapes get',
    'the job blocked, not finished.',
    '',
    'A customer is watching a progress page, so report as you go. After each search or',
    'route, print one line on its own:',
    '',
    `  PROGRESS <searches done>/${budget} <what just settled and what is running now>`,
    '',
    'If the job cannot be delivered as it was sold, print instead:',
    '',
    '  ATTENTION <what is not coming, in plain words>',
    '',
    'Never fabricate a fare. A route that returned nothing returns nothing, and that is a',
    'real finding — report it with PROGRESS and carry on with the rest.',
    '',
    `Finish with the takeout PDF written exactly here: ${join(REPORT_DIR, `${brief.job}.pdf`)}`,
    `  flt takeout --pdf -o ${join(REPORT_DIR, `${brief.job}.pdf`)} --title "..." --note "..."`,
    'Then give the desk the route count, the option count and the cover summary.',
  ].join('\n')
}

function statusPrompt(route: string, tier: string, report: Report, attention: string | null): string {
  return [
    `Job on the desk: ${route}, ${tier} tier.`,
    `${report.done} of ${report.total} searches done.`,
    attention
      ? `This job is marked ATTENTION. It cannot be delivered as sold: ${attention}`
      : `Latest from the back office: ${report.note || 'nothing new since the last line.'}`,
    '',
    'Give me the line for the status page.',
  ].join('\n')
}

// --- the run ------------------------------------------------------------------------------

const FALLBACK_WORKING = 'Still working.'
const FALLBACK_ATTENTION =
  'Your report has run into trouble on our side and is not going to arrive as it stands. We are looking at it and will be in touch.'

/**
 * The status writer is an API call like any other and can fail. A customer must still get
 * a truthful line when it does, so a failure falls back to the quiet version of nothing
 * new rather than to a cheerful sentence nobody wrote.
 */
async function lineFor(ask: Ask, prompt: string, fallback: string): Promise<string> {
  try {
    const line = (await ask('bureau-status', prompt)).trim()
    return line || fallback
  } catch {
    return fallback
  }
}

function titleCase(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

/**
 * Run one paid brief end to end: desk, then back office, then a status line per report.
 *
 * Yields the status snapshot after each write, so a caller sees progress at the same
 * moment the customer's page does. The generator does not throw — a run that dies still
 * has to leave a truthful file behind, so every failure lands as `attention` and comes
 * out as the last update.
 */
export async function* runBrief(brief: Brief, ask: Ask = askViaSdk): AsyncIterable<Update> {
  const budget = budgetFor(brief.tier)
  const pdfPath = join(REPORT_DIR, `${brief.job}.pdf`)

  const job: Job = {
    job: brief.job,
    route: `${brief.from} to ${brief.to}`,
    tier: titleCase(brief.tier),
    updated: new Date().toISOString(),
    state: 'working',
    progress: { done: 0, total: budget },
    line: '',
    pdf: null,
  }

  /** One place that stamps the clock and writes, so no update can reach disk unstamped. */
  const publish = async (): Promise<Job> => {
    job.updated = new Date().toISOString()
    return writeStatus({ ...job })
  }

  const halt = async (reason: string): Promise<Job> => {
    job.state = 'attention'
    job.line = await lineFor(
      ask,
      statusPrompt(job.route, job.tier, { ...job.progress, note: '' }, reason),
      FALLBACK_ATTENTION,
    )
    return publish()
  }

  // The desk first. It is the only step allowed to refuse the brief outright.
  let plan: string
  try {
    const answer = await ask('bureau-desk', deskPrompt(brief, budget))
    const found = answer.match(/\{[\s\S]*\}/)
    if (!found) throw new Error('the desk did not return a plan')
    const parsed = JSON.parse(found[0]) as { route?: string; plan?: string; blocker?: string | null }
    if (parsed.route) job.route = parsed.route
    if (parsed.blocker) {
      yield await halt(parsed.blocker)
      return
    }
    if (!parsed.plan) throw new Error('the desk returned a plan with no plan in it')
    plan = parsed.plan
  } catch (error) {
    yield await halt(error instanceof Error ? error.message : String(error))
    return
  }

  job.line = await lineFor(
    ask,
    statusPrompt(job.route, job.tier, { ...job.progress, note: 'the search is just starting' }, null),
    FALLBACK_WORKING,
  )
  yield await publish()

  // The back office runs on its own while this loop drains what it reports. A queue,
  // rather than yielding from the callback, because a generator cannot yield from inside
  // one — and because a report that arrives while a status line is being written must
  // wait its turn rather than be dropped.
  const pending: Array<{ report: Report; attention: string | null }> = []
  let wake: (() => void) | null = null
  let finished = false
  let failure: unknown = null

  const push = (report: Report, attention: string | null) => {
    pending.push({ report, attention })
    wake?.()
    wake = null
  }

  const research = ask('bureau-back-office', backOfficePrompt(brief, job.route, plan, budget), (text) => {
    const attention = parseAttention(text)
    const report = parseProgress(text)
    if (attention) push(report ?? { ...job.progress, note: '' }, attention)
    else if (report) push(report, null)
  })
    .catch((error: unknown) => {
      failure = error
      return ''
    })
    .finally(() => {
      finished = true
      wake?.()
      wake = null
    })

  let stopped = false
  while (!finished || pending.length > 0) {
    if (pending.length === 0) {
      await new Promise<void>((resolve) => {
        wake = resolve
      })
      continue
    }
    const next = pending.shift()
    if (!next) continue

    // Skip a report that says nothing new. The status writer is a model call per update,
    // and a repeated line costs money to produce and tells the customer nothing.
    const same = next.report.done === job.progress.done && !next.attention
    if (same && job.line) continue

    job.progress = { done: Math.min(next.report.done, next.report.total), total: next.report.total }
    if (next.attention) {
      job.state = 'attention'
      stopped = true
    }
    job.line = await lineFor(
      ask,
      statusPrompt(job.route, job.tier, next.report, next.attention),
      next.attention ? FALLBACK_ATTENTION : FALLBACK_WORKING,
    )
    yield await publish()
  }

  await research

  if (failure) {
    yield await halt(failure instanceof Error ? failure.message : String(failure))
    return
  }
  if (stopped) return

  // The PDF is the only claim in this pipeline that can be checked rather than believed,
  // so it is checked. A back office that says it wrote a report and did not gets the same
  // `attention` as one that admitted it could not.
  if (!existsSync(pdfPath)) {
    yield await halt('the report did not come out of the search, so there is nothing to send yet')
    return
  }

  job.state = 'ready'
  job.pdf = `/report/${brief.job}.pdf`
  job.progress = { done: job.progress.total, total: job.progress.total }
  job.line = await lineFor(
    ask,
    statusPrompt(job.route, job.tier, { ...job.progress, note: 'the report is finished and ready to open' }, null),
    'Your report is ready.',
  )
  yield await publish()
}
