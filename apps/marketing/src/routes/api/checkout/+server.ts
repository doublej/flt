import { type Brief, briefAmount, newJob, packBrief } from '$lib/brief'
import { stripeClient } from '$lib/server/stripe'
import { TIERS } from '$lib/tiers'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const prerender = false

/** The form is chips and free text, so anything can arrive here. Trim it, cap
 *  it, and let an empty string mean what it means in the form: no opinion. */
const text = (v: unknown, cap: number) => (typeof v === 'string' ? v.trim().slice(0, cap) : '')

const list = (v: unknown) =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === 'string')
        .slice(0, 12)
        .map((x) => x.slice(0, 60))
    : []

export const POST: RequestHandler = async ({ request, url }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  // The client sends a tier id, never a price. The amount comes off TIERS here.
  const tier = TIERS.find((t) => t.id === body.tier)
  if (!tier) error(400, 'That is not one of the three tiers.')

  const email = text(body.email, 200)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    error(400, 'We need an email address to send the report to.')

  const to = text(body.to, 200)
  if (!to) error(400, 'Tell us where you want to go.')

  const fields = {
    tier: tier.id as Brief['tier'],
    to,
    from: text(body.from, 200),
    month: text(body.month, 60),
    length: text(body.length, 60),
    dates: text(body.dates, 60),
    cabin: text(body.cabin, 60),
    priorities: list(body.priorities),
    dislikes: list(body.dislikes),
    dealbreakers: list(body.dealbreakers),
    notes: text(body.notes, 1500),
  }

  const job = newJob()
  const session = await stripeClient().checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    // Vouchers are Stripe's promotion codes, redeemed in Checkout's own field.
    // The operator creates them in the dashboard, which already does expiry,
    // redemption limits and reporting. Mutually exclusive with `discounts`, so
    // a pre-applied code from a link would have to replace this, not join it.
    allow_promotion_codes: true,
    // No payment_method_types: Checkout then offers everything enabled on the
    // account, which is how Apple Pay and Google Pay turn up without any work
    // here. Naming card explicitly would switch the others off.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: briefAmount(tier),
          product_data: { name: `Bureau — ${tier.name} report`, description: tier.scope },
        },
      },
    ],
    metadata: { job, ...packBrief(fields) },
    success_url: `${url.origin}/status?job=${job}`,
    cancel_url: `${url.origin}/#brief`,
  })

  if (!session.url) error(502, 'Stripe did not hand back a checkout page.')
  return json({ url: session.url })
}
