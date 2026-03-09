# flights-app (web)

SvelteKit flight search UI deployed on Cloudflare Pages. Powered by `@flights/core`.

## Quick start

```bash
bun install        # from monorepo root
just dev           # start dev server
```

Or directly: `bun --filter flights-app dev`

## Features

- **Search form** — origin/destination with autocomplete, one-way or round-trip, flexible dates (days before/after), cabin class, passengers, currency
- **Streaming results** — multi-date searches use SSE streaming with live progress; single-date searches return all at once
- **Price grid** — heatmap matrix of cheapest fares by departure/return date combination (green = low, red = high); click a cell to filter results
- **Filter panel** — stops (non-stop / 1 stop / 2+), price range slider, airlines, departure/arrival time ranges, max duration
- **Sort** — best, price, duration, stops, departure time, date
- **Flight cards** — airline logos, times, route path, duration, stops, price; expand for leg-by-leg detail with aircraft info, layover times, and route map
- **Route map** — Leaflet map with great-circle arcs between waypoints (dark CartoDB tiles, amber markers)
- **Booking links** — affiliate links (Aviasales via Travelpayouts) and Google Flights fallback per offer
- **Itinerary builder** — combine offers into multi-leg trips stored in localStorage; connection time warnings, total price and door-to-door travel time
- **AI tools** — copy/save results as markdown, export takeout document with affiliate booking links
- **Recent searches** — last 5 searches stored in localStorage with one-click re-run
- **Preferences** — passengers, cabin class, and currency persist across sessions via localStorage
- **Price trend banner** — shows "prices are low/typical/high right now" when data is available

## API endpoints

### `GET /api/airports`

Airport search by name, city, or IATA code.

| Param | Description |
|-------|-------------|
| `q` | Search query (min 1 character) |

Returns `Airport[]`.

### `GET /api/flights`

Single search (all date combinations resolved in one JSON response).

| Param | Required | Description |
|-------|----------|-------------|
| `from_airport` | yes | Origin IATA code |
| `to_airport` | yes | Destination IATA code |
| `date` | yes | Departure date (`YYYY-MM-DD`) |
| `return_date` | | Return date |
| `date_end` | | Flexible departure end date |
| `return_date_end` | | Flexible return end date |
| `adults` | | Number of adults (default `1`) |
| `children` | | Number of children |
| `infants_in_seat` | | Infants in seat |
| `infants_on_lap` | | Infants on lap |
| `seat` | | `economy` / `premium-economy` / `business` / `first` |
| `max_stops` | | `0`, `1`, or `2` |
| `currency` | | Currency code (default `EUR`) |

Returns `{ current_price, flights, google_flights_url }`.

### `GET /api/flights/stream`

Same parameters as `/api/flights`. Returns an SSE stream with events:

| Event | Data | Description |
|-------|------|-------------|
| `progress` | `{ completed, total }` | Search progress per date pair |
| `flights` | `Flight[]` | Batch of results as they arrive |
| `error` | `{ detail }` | Per-date-pair error |
| `done` | `{ current_price, google_flights_url }` | Stream complete |

Used automatically for multi-date (flexible) searches.

## Authentication

Password-gated via two environment variables:

| Variable | Description |
|----------|-------------|
| `PASSWORD` | App password |
| `SESSION_SECRET` | HMAC secret (`openssl rand -hex 32`) |

Sessions are stateless HMAC tokens stored in a `session` cookie (30-day expiry, httpOnly, secure, sameSite=lax). Uses Web Crypto (`HMAC` + `SHA-256`).

**Local dev without auth:** if `PASSWORD` or `SESSION_SECRET` is not set, the auth hook is skipped entirely.

## Deployment

Deployed on **Cloudflare Pages** with `@sveltejs/adapter-cloudflare`.

| Setting | Value |
|---------|-------|
| Build command | `bun run build` |
| Build output | `.svelte-kit/cloudflare` |
| Root directory | `apps/web` |
| Compatibility flags | `nodejs_compat` |

Set `PASSWORD` and `SESSION_SECRET` in the CF Pages dashboard under Environment Variables.

## Design

Dark theme with amber accents.

| Token | Value |
|-------|-------|
| Background | `#0c0e14` |
| Surface | `#161b22` |
| Primary (amber) | `#f0a030` |
| Text | `#e6edf3` |
| Body font | Space Grotesk |
| Mono font | Departure Mono |

## Commands

| Command | Description |
|---------|-------------|
| `just dev` | Start dev server |
| `just build` | Production build |
| `just preview` | Preview production build |
| `just check` | Lint + typecheck + test |
| `just typecheck` | TypeScript checking only |
| `just test` | Run tests |
| `just lint-fix` | Auto-fix lint issues |
| `just sync` | Sync SvelteKit types |

## Stack

SvelteKit 2, Svelte 5, Vite 5, TypeScript, Biome, Vitest, Leaflet, Cloudflare Pages
