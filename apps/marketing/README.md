# Bureau — marketing site

SvelteKit 2 + Svelte 5, prerendered, deployed to Cloudflare Pages.
`bun run dev` · `bun run lint` · `bun run check` · `bun test` · `bun run build`

## Payments

The brief form posts to `/api/checkout`, which prices the tier server-side and opens a
Stripe Checkout session; the customer pays on Stripe's page and lands back on
`/status?job=<id>`. Stripe then calls `/api/stripe-webhook`, which verifies the signature
and hands the paid brief to the desk.

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

### Testing the whole loop

Test mode only — use Stripe's `4242 4242 4242 4242`, never a real card.

```bash
stripe listen --forward-to localhost:5173/api/stripe-webhook   # prints the whsec_…
# in another shell, with both variables in the environment:
bun run dev
```

Fill in the brief, pay on Stripe's page, and a file appears at `.bureau/queue/<job>.json`
in the repo root. `stripe trigger checkout.session.completed` exercises the endpoint but
writes nothing: the session it invents carries no job id, and the webhook ignores anything
it did not start.

The queue is a directory of JSON files, which only works because dev runs in Node. A
Worker has no filesystem, so the deployed site logs the paid brief and drops it —
production needs CF Queues or KV before this takes real money.
