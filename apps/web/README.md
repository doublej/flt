# flt

Flight search CLI powered by Google Flights. Search routes, compare prices across dates, build multi-leg itineraries, and export results — all from the terminal.

## Install

Requires [Bun](https://bun.sh).

```bash
# run directly
bunx github:doublej/flt

# install globally
bun install -g github:doublej/flt
```

Or clone and use the Justfile:

```bash
bun install
just flt <command> [options]
```

## Smart routing

The CLI detects intent from raw arguments — no subcommand needed:

```bash
flt AMS NRT 2026-04-10              # search flights
flt AMS NRT 2026-04-10 2026-04-20   # round trip
flt ams                              # find airports
flt O1                               # inspect last result
```

## Commands

### search

Search flights between two airports.

```bash
flt search <FROM> <TO> <DATE> [RETURN_DATE]
```

| Flag | Description |
|------|-------------|
| `--seat` | `economy` / `premium-economy` / `business` / `first` |
| `--pax` | Passengers: `1ad`, `2ad1ch`, `1ad1in` |
| `--currency` | Currency code (default: `EUR`) |
| `--direct` | Direct flights only |
| `--max-stops` | Max stops: `0`, `1`, `2` |
| `--carrier` | Filter by airline name substring |
| `--dep-after` / `--dep-before` | Departure time window (`HH:MM`) |
| `--arr-after` / `--arr-before` | Arrival time window (`HH:MM`) |
| `--max-dur` | Max flight duration in minutes |
| `--date-end` | Flexible departure end date (searches each day in range) |
| `--return-date-end` | Flexible return end date |
| `--sort` | `price` / `dur` / `stops` / `dep` (default: `price`) |
| `--fmt` | `table` / `jsonl` / `tsv` / `brief` (default: `table`) |
| `--fields` | Comma-separated field list |
| `--view` | Field preset: `min` / `std` / `full` |
| `--limit` | Max results (default: `100`) |
| `--refresh` | Skip cache, force fresh fetch |

### matrix

Compare cheapest fares across a date range.

```bash
# one-way
flt matrix <FROM> <TO> <DATE_START> <DATE_END>

# round trip
flt matrix <FROM> <TO> <DEP_START> <DEP_END> <RET_START> <RET_END>
```

Supports `--seat`, `--pax`, `--max-stops`, `--max-dur`, `--currency`, `--fmt` (`table` / `tsv` / `jsonl`). Max 21 date combinations per run.

### inspect

Show full details for a flight offer.

```bash
flt inspect <ID>
flt O1                                       # latest search
flt inspect AMS-NRT@20260408#A1B2C3:O1       # cross-search ref
```

`--fmt json` (default) or `--fmt table` for key-value layout. Shows legs, layovers, aircraft, and booking URL.

### itinerary

Combine cached offers into a multi-leg itinerary.

```bash
flt itinerary <REF:ID> [REF:ID...] [--title "..."] [--note "..."]
```

Validates connection times and warns about tight or long layovers. Shows per-leg breakdown with total price and door-to-door travel time.

### airports

Look up airport codes by city, name, or IATA code.

```bash
flt airports <QUERY>
flt tokyo                    # smart routing shortcut
```

`--limit` controls max results (default: `20`).

### takeout

Export session results and itineraries to a markdown file.

```bash
flt takeout [--title "..."] [-o path] [--itin "Title" REF:ID REF:ID --note "..."]
```

Only includes searches from the current session (see `session start`). Default output: `~/Desktop/flights-<date>-<time>.md`.

### session

Manage session boundaries for scoped exports.

```bash
flt session start            # mark start of a new session
```

Takeout only includes searches made after the latest `session start`.

### config

Persist CLI defaults so you don't repeat flags.

```bash
flt config                   # list all
flt config currency USD      # set default
flt config currency          # read value
flt config currency --unset  # remove
```

Valid keys: `currency`, `fmt`, `seat`, `pax`, `limit`, `marker`, `trs`.

### prime

Print the agent guide — a structured prompt that teaches AI coding agents how to use flt.

```bash
flt prime
```

## Session & caching

- Each search is cached by its full query shape (route, date, cabin, pax, stops, currency).
- Cache entries are valid for 6 hours. Use `--refresh` to bypass.
- Every search gets a ref like `AMS-NRT@20260408#A1B2C3`. Reference offers across searches with `REF:ID` notation.
- `flt session start` scopes takeout exports to the current session.

## Web UI

SvelteKit app deployed on Cloudflare Pages with search form, flight cards, route maps, and price grid. See the [agent session viewer](https://doublej.github.io/flt/agent-session.html) for a visual walkthrough of a multi-leg search session.

```bash
just dev      # start dev server
just build    # production build
just preview  # preview build
```

## Stack

TypeScript, SvelteKit, Vite, Cloudflare Pages, Bun, Biome, Vitest

## Quality

```bash
just check    # loc-check + lint + typecheck + test
```
