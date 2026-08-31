# Bureau — marketing site

SvelteKit 2 + Svelte 5, prerendered, deployed to Cloudflare Pages.
`bun run dev` · `bun run lint` · `bun run check` · `bun test` · `bun run build`

## Payments

The brief form posts to `/api/checkout`, which prices the tier server-side and opens a
Stripe Checkout session; the customer pays on Stripe's page and lands back on
`/status?job=<id>`. Stripe then calls `/api/stripe-webhook`, which verifies the signature
and logs it. Fulfilment is a **pull**, not a push — see below.

The whole site is prerendered, so both endpoints set `export const prerender = false`.

### Secrets

Two, and they never go in a file:

| Variable | Where it comes from |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (`sk_test_…` while testing) |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` prints it locally; the dashboard's endpoint page has the deployed one (`whsec_…`) |

Locally they come from 1Password through `onenv` (`onenv prime` explains the CLI); on
Cloudflare Pages they are set in the project's environment variables. The code reads them
through `$env/dynamic/private`, so the same code works in both places. Without them both
endpoints answer 500 and nothing else happens.

```bash
onenv set bureau STRIPE_SECRET_KEY          # any namespace; bureau is the obvious one
onenv set bureau STRIPE_WEBHOOK_SECRET
onenv export bureau -- bun run dev          # or onenv init once, then onenv run -- bun run dev
```

### Vouchers

Free searches are Stripe promotion codes, not a table in this repo. In the dashboard:
Product catalogue → Coupons → a 100%-off coupon, then a promotion code on it
(`BUREAU100`). Redemption limits, expiry and per-customer caps live there. The customer
types the code into Checkout's own "Add promotion code" field — the brief form has no
voucher input, and does not need one.

A 100%-off code takes the session to zero, and Stripe then completes it **without
collecting a payment method**: `payment_status` comes back `no_payment_required`, not
`paid`, and `amount_total` is `0`. Both are handled — see `isSettled` in `src/lib/brief.ts`
— and the Brief records the amount actually charged, so a voucher job stays tellable from
a paid one afterwards.

### Testing the whole loop

Test mode only — use Stripe's `4242 4242 4242 4242`, never a real card.

```bash
stripe listen --forward-to localhost:3848/api/stripe-webhook   # prints the whsec_…
# in another shell, with both variables in the environment:
bun run dev
```

Fill in the brief and pay on Stripe's page. Then, from the repo root:

```bash
just pull
```

and the brief appears at `.bureau/queue/<job>.json`, where `apps/bureau` picks it up.
`stripe trigger checkout.session.completed` is no use here: the session it invents carries
no job id, and nothing downstream will touch a session this site did not start.

### Why fulfilment pulls

The whole brief is written into the Checkout session's metadata **before the customer
pays** (`packBrief`, called from `api/checkout/+server.ts`), so Stripe is already a durable
record of every order placed. `scripts/pull-briefs.ts` reads it back out: it lists complete
sessions, keeps the settled ones, unpacks the metadata, and writes the queue file — skipping
any job already in `queue/`, `done/`, or parked as `.bad`, so running it twice is free.

That is why the deployed Worker needs no queue, no KV and no D1. A push-based webhook would
have to hand the brief to something with a filesystem, and the only such thing is the desk
on the operator's machine — which is where `just pull` already runs. Delivery also writes
into `static/status/` and `static/report/` and needs a redeploy, so "whenever the operator
runs `just pull`" was already the binding constraint on latency. If it stops being one, the
upgrade is a cron on that machine, not a Cloudflare binding.
