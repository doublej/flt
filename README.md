# flt

Flight search tool with a CLI and web UI. Searches Google Flights under the hood.

## CLI

The `flt` CLI runs with [Bun](https://bun.sh) via the Justfile:

```bash
just flt <command> [options]
```

### Smart routing

The CLI detects intent from raw arguments — no subcommand needed for common cases:

```bash
just flt AMS NRT 2026-04-10          # search flights
just flt AMS NRT 2026-04-10 2026-04-20  # round trip
just flt ams                          # find airports matching "ams"
just flt O1                           # inspect offer #1 from last search
```

### Commands

| Command | Description |
|---------|-------------|
| `search` | Search flights between airports |
| `inspect` | Show details for an offer from the last search |
| `itinerary` | Build multi-leg itineraries |
| `matrix` | Price matrix across date ranges |
| `airports` | Look up airport codes |
| `prime` | Prime the cache for upcoming searches |
| `takeout` | Export search results |
| `config` | Manage CLI defaults |

### Search options

```bash
just flt search AMS NRT 2026-04-10 \
  --seat business \
  --pax 2ad1ch \
  --currency EUR \
  --direct \
  --sort price \
  --fmt table \
  --limit 5
```

Key flags: `--seat` (economy/business/first), `--pax` (e.g. `2ad1ch`), `--direct`, `--max-stops`, `--carrier`, `--dep-after`/`--dep-before`, `--arr-after`/`--arr-before`, `--max-dur`, `--sort` (price/dur/stops/dep), `--fmt` (table/jsonl/tsv/brief).

Flexible date ranges with `--date-end` and `--return-date-end`.

## Web UI

SvelteKit app deployed on Cloudflare Pages. Provides a search form, flight cards with route maps, and a price grid.

```bash
just dev      # start dev server
just build    # production build
just preview  # preview production build
```

## Setup

```bash
bun install   # or: just install
```

## Stack

TypeScript, SvelteKit, Vite, Cloudflare Pages, Bun, Biome, Vitest

## Quality

```bash
just check    # runs loc-check + lint + typecheck + test
```
