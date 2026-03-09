# flt — Flight Search CLI

Command-line interface for searching flights via Google Flights. Built on `@flights/core` with [citty](https://github.com/unjs/citty).

```
just flt AMS NRT 2026-04-10
```

## Quick start

```bash
# From the monorepo root
bun install
just flt <cmd>

# Or directly
cd apps/cli && bun run src/index.ts <cmd>
```

## Smart routing

Raw arguments are auto-detected before citty parses them. No subcommand needed for the most common operations:

| Input pattern | Detected as | Example |
|---|---|---|
| `<word>` | `airports` (top 5) | `flt tokyo` |
| `F<hex>` | `inspect` | `flt Fa3b7` |
| `<FROM> <TO> <date> [return]` | `search` | `flt AMS NRT 2026-04-10` |

Date detection recognizes `YYYY-MM-DD`, `DD/MM/YYYY`, `today`, `tomorrow`, and `overmorrow`.

## Commands

### search

Search flights between two airports.

```
flt search <FROM> <TO> <DATE> [RETURN_DATE] [options]
flt AMS NRT 2026-04-10                         # one-way
flt AMS NRT 2026-04-10 2026-04-18              # round-trip
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--seat` | string | `economy` | Cabin class: `economy`, `premium-economy`, `business`, `first` |
| `--pax` | string | `1ad` | Passengers (see [Passenger format](#passenger-format)) |
| `--max-stops` | string | | Max stops: `0`, `1`, `2` |
| `--currency` | string | `EUR` | Currency code |
| `--fmt` | string | `table` | Output format: `jsonl`, `tsv`, `table`, `brief` |
| `--fields` | string | | Comma-separated field list (overrides `--view`) |
| `--view` | string | `std` | Field preset: `min`, `std`, `full` |
| `--sort` | string | `price` | Sort by: `price`, `dur`, `stops`, `dep` |
| `--limit` | string | `100` | Max results |
| `--direct` | boolean | `false` | Direct flights only |
| `--carrier` | string | | Filter by airline name or 2-letter code |
| `--exclude-carrier` | string | | Exclude airlines (comma-separated names/codes) |
| `--exclude-hub` | string | | Exclude layover airports (comma-separated IATA codes) |
| `--dep-after` | string | | Depart after `HH:MM` |
| `--dep-before` | string | | Depart before `HH:MM` |
| `--arr-after` | string | | Arrive after `HH:MM` |
| `--arr-before` | string | | Arrive before `HH:MM` |
| `--max-dur` | string | | Max duration in minutes |
| `--date-end` | string | | Flexible departure end date (expands into date range) |
| `--return-date-end` | string | | Flexible return end date |
| `--refresh` | boolean | `false` | Force fresh fetch, skip cache |

### matrix

Date-flexible price grid. Fetches cheapest price per date combination.

```
flt matrix <FROM> <TO> <DATE_START> <DATE_END>                          # one-way grid
flt matrix <FROM> <TO> <DEP_START> <DEP_END> <RET_START> <RET_END>     # round-trip grid
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--seat` | string | `economy` | Cabin class |
| `--pax` | string | `1ad` | Passengers |
| `--max-stops` | string | | Max stops |
| `--max-dur` | string | | Max duration in minutes (filters before cheapest pick) |
| `--carrier` | string | | Filter by airline name or 2-letter code |
| `--exclude-carrier` | string | | Exclude airlines (comma-separated names/codes) |
| `--exclude-hub` | string | | Exclude layover airports (comma-separated IATA codes) |
| `--direct` | boolean | `false` | Direct flights only |
| `--currency` | string | `EUR` | Currency code |
| `--fmt` | string | `table` | Output format: `table`, `tsv`, `jsonl` |

Round-trip grids are limited to 21 date combinations. One-way grids print a flat table with date, cheapest price, carrier, stops, and duration.

### inspect

Show full details of a flight offer.

```
flt inspect <ID>
flt Fa3b7                                       # shortcut, latest search
flt inspect AMS-NRT@20260410#A1B2C3:Fa3b7       # cross-search ref
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--fmt` | string | `json` | Output format: `json`, `table` |

Table format shows key/value pairs including per-leg details (flight number, route, times, aircraft) and layover info with tight/long warnings.

### itinerary

Compose a multi-leg itinerary from cached offers.

```
flt itinerary <REF:ID> [REF:ID...] [options]
flt itinerary AMS-NRT@20260410#A1B2C3:Fa3b7 NRT-AMS@20260418#D4E5F6:Fc1d2 --title "Japan trip"
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--title` | string | | Itinerary title |
| `--note` | string | | Note displayed below the table |

Outputs a table with total price, door-to-door travel time, and inter-leg layover durations. Connection warnings are printed for tight (<2h), long (>24h), or overlapping connections.

### airports

Search airports by name, city, or IATA code.

```
flt airports <QUERY>
flt tokyo                                       # shortcut via smart routing
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--limit` | string | `20` | Max results (smart routing defaults to `5`) |

Returns JSONL with `code`, `name`, `city`, `country` per match.

### takeout

Export all session search results (and optional itineraries) to a markdown file.

```
flt takeout
flt takeout --title "Spring trip" -o ./trip.md
flt takeout --itin "Best value" REF:Fa3b7 REF:Fc1d2 --note "4h layover" --itin "Overnight" REF:Fa3b7 REF2:Fd5e6
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `-o`, `--output` | string | `~/Desktop/flights-<date>-<time>.md` | Output file path |
| `--title` | string | | Document title |
| `--keep-session` | boolean | `false` | Keep session open after export |
| `--itin` | repeatable | | Start an itinerary block: `--itin "Title" REF:ID [REF:ID...] [--note "..."]` |

By default, takeout closes the active session. Use `--keep-session` to prevent this. The exported markdown includes all search results and any composed itineraries with affiliate booking links (if configured).

### session

Manage search sessions. Sessions group searches so you can reference them later.

#### session start

```
flt session start ["Trip name"]
```

Start a new named session. Closes any currently active session first.

#### session close

```
flt session close
```

Close the active session.

#### session list

```
flt session list
```

List all sessions (active and closed) as JSON with id, name, status, search count, and timestamps.

#### session reopen

```
flt session reopen [id]
```

Re-open the most recently closed session, or a specific one by ID.

#### session refs

```
flt session refs [--id s1]
```

List search refs for a session (with query and offer count). Defaults to the active session.

#### session rename

```
flt session rename "New name" [--id s1]
```

Rename the active session, or a specific session by `--id`.

#### session nuke

```
flt session nuke
```

Delete all cached searches and session data. Irreversible.

### favorites

Star interesting offers during your session. Favorites are session-scoped and survive filter/sort changes and cache expiry.

```
flt fav Fa3b7                                   # star an offer
flt unfav Fa3b7                                 # remove from favorites
flt favs                                        # list all favorites
flt favs --fmt brief --view full                # with format/view options
```

### Connection map (library)

The `@flights/core` package exposes `findConnectionRoutes()` for discovering multi-stop routes through real airline connections. This is a planning tool — use it before searching to map out what's possible.

```typescript
import { findConnectionRoutes } from '@flights/core'

const routes = findConnectionRoutes('AMS', 'SYD', {
  minStops: 5,
  maxStops: 10,
  maxDetour: 3.0,
  via: ['BKK'],               // force Bangkok as waypoint
  exclude: ['DXB', 'DOH'],    // skip Gulf hubs
})
```

| Option | Type | Default | Description |
|---|---|---|---|
| `minStops` | number | `5` | Minimum intermediate stops |
| `maxStops` | number | `10` | Maximum intermediate stops |
| `maxResults` | number | `50` | Max routes returned |
| `maxDetour` | number \| null | `3.0` | Max detour ratio vs direct distance (null = unlimited) |
| `via` | string[] | | Required waypoints in order |
| `exclude` | string[] | | Airports to avoid (IATA codes) |

Each result includes `path`, `stopCount`, `totalKm`, `directKm`, and `detourRatio`.

### config

Get or set CLI defaults. Config is stored at `~/.config/flt/config.json`.

```
flt config                          # list all
flt config currency                 # read one key
flt config currency USD             # set
flt config currency --unset         # remove
```

| Key | Description |
|---|---|
| `currency` | Default currency code (e.g. `EUR`, `USD`) |
| `fmt` | Default output format |
| `seat` | Default cabin class |
| `pax` | Default passengers |
| `limit` | Default result limit |
| `marker` | Travelpayouts affiliate marker |
| `trs` | Travelpayouts project/trs ID |
| `tp_token` | Travelpayouts API token |

Config values serve as defaults; CLI flags always override them.

### prime

Print the agent how-to guide for `flt`. Designed for LLM agents (e.g. Claude Code) to learn how to use the CLI, including workflow, rate-limit rules, caching, and error handling.

```
flt prime
```

## Output formats

| Format | Description |
|---|---|
| `table` | Aligned columns (default for `search` and `matrix`) |
| `brief` | One-line-per-offer compact format |
| `jsonl` | One JSON object per line |
| `tsv` | Tab-separated with header row |

### Field presets (`--view`)

| Preset | Fields |
|---|---|
| `min` | `id`, `price`, `stops`, `dur` |
| `std` | `id`, `price`, `stops`, `dur`, `car`, `dep`, `arr`, `date` |
| `full` | `id`, `price`, `stops`, `dur`, `car`, `flt_no`, `dep`, `arr`, `date`, `best`, `ret`, `ahead` |

### Available fields (`--fields`)

| Field | Description |
|---|---|
| `id` | Offer ID (e.g. `Fa3b7`) |
| `price` | Price with currency symbol |
| `stops` | Number of stops |
| `dur` | Duration (e.g. `12h 30m`) |
| `car` | Carrier/airline name |
| `flt_no` | Flight numbers (slash-separated) |
| `dep` | Departure time |
| `arr` | Arrival time |
| `date` | Departure date |
| `best` | `yes` if marked as best offer |
| `ret` | Return date |
| `ahead` | Arrival time ahead indicator (e.g. `+1`) |
| `url` | Google Flights URL |

## Passenger format

Passengers are specified as a compact string combining counts with type suffixes:

| Suffix | Type |
|---|---|
| `ad` | Adults |
| `ch` | Children |
| `is` | Infants in seat |
| `il` | Infants on lap |
| `in` | Infants on lap (alias for `il`) |

Examples: `1ad` (1 adult), `2ad1ch` (2 adults + 1 child), `1ad1in` (1 adult + 1 infant on lap), `2ad2ch1is` (2 adults + 2 children + 1 infant in seat).

## Date formats

The CLI accepts three date formats, automatically normalized to `YYYY-MM-DD`:

| Format | Example |
|---|---|
| ISO 8601 | `2026-04-10` |
| DD/MM/YYYY | `10/04/2026` |
| Relative | `today`, `tomorrow`, `overmorrow` |

Past dates are rejected with a `PAST_DATE` error.

## Sessions and caching

### Cache

Each concrete search (exact departure date, return date, cabin, pax, stops, currency) is cached independently at `$TMPDIR/flt/cache/`. Cache entries are valid for **6 hours** (`CACHE_TTL_MS`). Use `--refresh` to bypass the cache.

Cache keys are SHA-1 hashes of the full query shape. Changing any parameter (return date, cabin, pax, stops, currency) creates a distinct cache entry.

### Refs

Every cached search gets a human-readable ref like `AMS-NRT@20260410#A1B2C3`. Individual offers within a search are addressed as `REF:ID` (e.g. `AMS-NRT@20260410#A1B2C3:Fa3b7`).

Each flight has a stable hash-based ID (e.g. `Fa3b7`) derived from its legs. IDs survive re-filtering, re-sorting, and re-searching. Plain IDs like `Fa3b7` only resolve against the latest `flt search` snapshot. For cross-search or post-matrix lookups, always use the full `REF:ID` format.

### Sessions

Sessions group related searches under a name. They are stored in `$TMPDIR/flt/session.json`.

- Searching without an active session auto-starts one (named after the route, e.g. "AMS -> NRT search").
- `flt takeout` auto-closes the active session unless `--keep-session` is passed.
- `flt session start` closes any previous active session before starting a new one.
- Duplicate session names are auto-suffixed (e.g. "Trip (2)").

### Throttling

A built-in 3-second delay is enforced between Google Flights requests. No manual sleeping needed.

## Affiliate config

Configure Travelpayouts affiliate credentials to include booking links in takeout exports:

```bash
flt config marker 709151
flt config trs 505891
```

When both `marker` and `trs` are set, takeout documents include affiliate booking links (via Aviasales) per route alongside Google Flights fallback URLs.

## Error codes

All errors are JSON: `{"err": "CODE", "hint": "..."}`.

| Code | Cause | Suggestion |
|---|---|---|
| `BLOCKED` | Google returned HTTP error or CAPTCHA (`http` / `no_script`) | Wait a few minutes, retry from a different IP |
| `NO_RESULTS` | No flights found (`no_flights`) | Try different dates or allow more stops |
| `NO_DATA` | Page loaded but flight data missing (`no_data`) | Google may have changed page structure |
| `BAD_DATE` | Invalid date format | Use `YYYY-MM-DD`, `DD/MM/YYYY`, or `today`/`tomorrow`/`overmorrow` |
| `PAST_DATE` | Date is in the past | Use a future date |
| `BAD_AIRPORT` | Unknown IATA code | Run `flt airports <query>` to find valid codes |
| `NO_SESSION` | No cached search results | Run `flt search` first |
| `NOT_FOUND` | Offer ID/ref not found in session | Check available refs with `flt session list` |
| `TOO_MANY` | Matrix date range exceeds 21 combos | Narrow the date range |
| `NO_MATCH` | No airports matching query | Try a different search term |
| `DUPLICATE_NAME` | Session name already exists | Choose a different name |
