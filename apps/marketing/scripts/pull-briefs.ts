#!/usr/bin/env bun
/** Pulls paid briefs out of Stripe and into `.bureau/queue/`, where the desk
 *  (`apps/bureau`) already watches for them.
 *
 *      just pull
 *
 *  There is no queue service behind this and there does not need to be. The
 *  whole brief is written into the Checkout session's metadata *before* the
 *  customer pays (see `packBrief`, and `api/checkout/+server.ts`), so Stripe is
 *  already a durable store of every order — including the ones the webhook
 *  dropped when it ran on a Worker with no filesystem. This just reads it back.
 *
 *  Delivery already requires the operator to run the desk locally and redeploy
 *  the static status/report files, so "whenever the operator runs `just pull`"
 *  is not the binding constraint on latency. If it ever becomes one, the
 *  upgrade is a cron on this machine, not a Cloudflare binding. */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import Stripe from 'stripe'
import { type Brief, isSettled, unpackBrief } from '../src/lib/brief'

const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error('STRIPE_SECRET_KEY is not set — run through `onenv run`')

const BUREAU = new URL('../../../.bureau/', import.meta.url)
const QUEUE = new URL('queue/', BUREAU)
const DONE = new URL('done/', BUREAU)

/** Already pulled, already run, or parked as unparseable — all three mean the
 *  operator has seen this job and writing it again would re-run a paid search. */
function seen(job: string): boolean {
  return [
    new URL(`${job}.json`, QUEUE),
    new URL(`${job}.json.bad`, QUEUE),
    new URL(`${job}.json`, DONE),
  ].some((u) => existsSync(u))
}

await mkdir(QUEUE, { recursive: true })

console.log(`stripe: ${key.startsWith('sk_live_') ? 'LIVE' : 'test'} mode`)

const stripe = new Stripe(key)
// ponytail: last 100 sessions, no pagination — add starting_after past ~50/week.
const { data } = await stripe.checkout.sessions.list({ limit: 100 })

let written = 0
let skipped = 0

for (const session of data) {
  const job = session.metadata?.job
  // A session without our job id was not started by this site; leave it be.
  if (!job || session.status !== 'complete' || !isSettled(session.payment_status)) continue

  if (seen(job)) {
    skipped++
    continue
  }

  const brief: Brief = {
    job,
    ...unpackBrief(session.metadata ?? {}),
    amount: session.amount_total ?? 0,
    currency: 'eur',
    email: session.customer_details?.email ?? session.customer_email ?? '',
    paidAt: new Date(session.created * 1000).toISOString(),
  }

  await writeFile(new URL(`${job}.json`, QUEUE), `${JSON.stringify(brief, null, 2)}\n`)
  console.log(
    `+ ${job}  ${brief.tier}  ${brief.email}  €${(brief.amount / 100).toFixed(2)}  ${brief.paidAt}`,
  )
  written++
}

console.log(`${written} queued, ${skipped} already seen, ${data.length} sessions scanned`)
