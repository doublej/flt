# flights-marketing (Bureau)

> The commercial site — SvelteKit 2 + Svelte 5, prerendered, Stripe Checkout,
> deployed to Cloudflare Pages at `flt-ecom.jurrejan.com`.

## Stack

- TypeScript, bun, Biome (not ESLint/Prettier), `bun test`
- SvelteKit 2 + Svelte 5 runes, Cloudflare Pages adapter, fully prerendered
- GSAP + ScrollTrigger for motion, Tweakpane for the `?tune` pane
- Stripe (`stripe` SDK) for Checkout; no other runtime dependency
- **No Tailwind, no UI library, no CSS-in-JS.** One global stylesheet plus scoped styles.

## Commands

Use `just` (this directory has its own Justfile):

- `just dev` — dev server on **3848**
- `just check` — loc-check + lint + typecheck + test
- `just loc-check` — file lengths (warn >300, error >400) with an explicit debt ledger
- `just test` / `just lint` / `just lint-fix` / `just typecheck` / `just build`

From the repo root:

- `just pull` — pull paid briefs out of Stripe into `.bureau/queue/` for the desk
- `just shot <url> <w> <h> <out.png> [selector]` — screenshot through headless Chrome
- `just breakpoints <url>` — the 7-width sweep into `local/shots/`
- `just marketing-deploy` — build + `wrangler pages deploy`

`just shot` is how you look at this site. The browser extension's `resize_window`
reports success without moving anything; `scripts/view.ts` drives CDP directly and
its header comments document the three traps that produce blank or wrong-width PNGs.

## Project Structure

```
src/
├── routes/
│   ├── [[lang=lang]]/
│   │   ├── +page.svelte      # the whole marketing page (1181 lines, 68% of it scoped CSS)
│   │   └── status/           # /status?job=<id> — polls a prerendered /status/<id>.json
│   ├── api/
│   │   ├── checkout/         # prices the tier server-side, opens a Stripe session
│   │   └── stripe-webhook/   # signature-verify + audit log; fulfilment is `just pull`
│   └── labs/splitflap/       # throwaway rigs for the board (board, perf, photo, terminal)
├── lib/
│   ├── components/           # CompositeStage, SplitFlapBoard, QueryGrid, BriefForm, …
│   ├── i18n/                 # en.ts, nl.ts, copy.svelte.ts — the only copy source
│   ├── server/               # stripe.ts (server-only)
│   ├── blobs.ts              # the organic shapes, as unit-box bezier paths
│   ├── splitflap.ts          # board physics (+ splitflap-canvas.ts renderer)
│   ├── lightbox-canvas.ts    # LightBox's canvas grade
│   ├── scenarios.ts tiers.ts # the numbers. Copy that shows one takes it as a parameter.
│   └── tuning.ts             # localStorage tuning, fingerprinted against its defaults
├── app.css                   # the ONLY global stylesheet, single :root
└── app.html                  # HTML shell; fonts load from Google Fonts here
scripts/pull-briefs.ts        # Stripe → .bureau/queue
```

## Conventions

### Tokens

`src/app.css` is the only global stylesheet, with a single `:root`. Live groups:
`--color-*`, `--font-*` + `--display-wide`, `--text-h2|h3|lead`, `--space-1…6`,
`--section-y` / `--gutter` / `--measure` / `--measure-heading`, `--radius*`, `--shadow-lg`,
`--ease-out`.

The type scale is **deliberately not tokenised**. The bespoke `clamp()` calls are
editorial decisions, one per heading, not drift — do not "unify" them.

There are **no duration tokens**, and none are wanted. The de-facto standards are
`0.7s cubic-bezier(0.22, 1, 0.36, 1)` for reveals (that curve is `--ease-out`; use the
token) and `0.15–0.25s ease` for hover. Every other transition string in the file differs
because it should.

### Motion

The GSAP convention is consistent across ten call sites and is law:

```js
gsap.fromTo(
  el,
  { opacity: 0, y: 36 },              // or y: 48
  {
    opacity: 1, y: 0,
    duration: 0.7,
    ease: 'power2.out',
    immediateRender: false,
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
  },
)
```

**`fromTo` with `immediateRender: false`, never `from`.** `from` writes the start state
at tween-creation time, which on a prerendered page flashes the end state first.

Parallax is `{ start: 'top bottom', end: 'bottom top', scrub: 0.6 }` with `ease: 'none'`.

Reduced motion, both halves:

1. In `onMount`, early-return on `matchMedia('(prefers-reduced-motion: reduce)').matches`
   **before** the dynamic `import('gsap')` — so the library is never even fetched.
2. The global kill switch at the bottom of `app.css` (`animation: none !important`).

Always `gsap.context(...)` and `return () => ctx?.revert()` from `onMount`.

### Shapes

Organic shapes are **`src/lib/blobs.ts` + an SVG `<clipPath clipPathUnits="objectBoundingBox">`**,
never `border-radius`. The paths are closed beziers in 0..1 coordinates, so one path
serves any size or aspect ratio. Working examples: `QueryGrid.svelte:114-120` (the `<defs>`
block + `style:clip-path="url(#blob-…)"`) and `Story.svelte`.

If a shape looks like a rounded rectangle, it is wrong.

### i18n

- **Never write a user-facing string in markup.** Add it to `en.ts`, then `nl.ts`.
  `nl.ts` is typed `Messages = typeof en`, so a missing key is a type error.
- **Always `const copy = $derived(getCopy())`** — never a module-scope
  `import { en } from '$lib/i18n/en'`. A module-scope import serves English on `/nl` and
  compiles clean. `src/lib/i18n/no-direct-en.test.ts` fails the build if one comes back.
  Type-only `import type { en }` is fine (erased at build time).
- **Never bake a measured figure into a string.** Numbers live in `scenarios.ts` / `tiers.ts`;
  a string that shows one is a function taking it as a parameter.
- A non-breaking space is written `\u00a0`, never `&nbsp;` — see the header of `en.ts`.

### Hazards

- **`SplitFlapBoard` and `LightBox` must never sit inside a `<p>`.** Both render block
  elements; the HTML parser closes the paragraph, server and client trees disagree, and
  hydration throws `HierarchyRequestError` — which kills hydration for the *whole page*,
  not just that component. Nothing in either file can guard against it.
- `+page.svelte:213` wraps the hero in `{#key tuning}`, which remounts the tree. Anything
  that moves `LOOK` or the stage's props has to be smoke-tested with `?tune` on and off.

### The `look` config and `?tune`

The hero's grade lives in the `LOOK` object (`src/lib/look.ts`, bound into `+page.svelte`).
`CompositeStage` takes it as `$bindable()`, so the pane writes straight back through the
binding. The Tweakpane pane is gated behind the `?tune` query param — read from
`location.search` after mount, never during SSR — and persisted by `src/lib/tuning.ts`
under a djb2 fingerprint of the defaults.

**That fingerprint is why the two `labs/` `look` literals must stay divergent from
production.** Unifying them changes the fingerprint and silently discards every saved
tuning.

## Owned paths

Up to six sessions have edited this app at once, and `+page.svelte` was rewritten 38 times
in one evening — several "you didn't apply that" complaints were literally true: applied,
then overwritten by a peer. This table is the fix, and it is **advisory, not enforced**.

| Role | Owns |
| --- | --- |
| hero / compositing | `CompositeStage.svelte`, `SplitFlapBoard.svelte`, `LightBox.svelte`, `FlapText.svelte`, `lib/splitflap*.ts`, `lib/composite.ts`, `lib/tuning.ts`, `lib/look.ts` |
| page / layout | `routes/[[lang=lang]]/+page.svelte`, `app.css` |
| data viz | `QueryGrid`, `WeekBoard`, `FareRange`, `RouteWeb`, `AvoidHubs`, `lib/scenarios.ts` |
| commerce | `BriefForm`, `PriceTiers`, `routes/api/**`, `lib/server/**`, `lib/brief.ts`, `lib/tiers.ts`, `scripts/pull-briefs.ts` |
| copy / i18n | `lib/i18n/**` |

**A session touching a file outside its set says so first.** `+page.svelte` and `app.css`
are the two files everyone reaches for; giving them one owner is most of the fix.

`~/.claude/skills/teams` presets have no field for file scopes, so a preset that spawns
into this app quotes this table in its `spawn_prompt`. This table is the source.

## Further reading

- [README.md](README.md) — payments, secrets, vouchers, testing the Stripe loop
- [CHARTS.md](CHARTS.md) — the data-viz components
- [SPLITFLAP.md](SPLITFLAP.md) — the board's physics and renderer
- [../../CLAUDE.md](../../CLAUDE.md) — the monorepo
