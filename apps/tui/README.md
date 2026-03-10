# FLIGHTS/RES TUI

Sabre/GDS-style green-on-black terminal interface for flight search. Fullscreen, keyboard-driven, with authentic CRT aesthetics including boot animations, scanline transitions, and a pulsing loading bar.

## Quick start

```bash
just tui
```

Or directly:

```bash
cd apps/tui && bun run src/index.ts
```

Requires a TTY (interactive terminal). All input is forced to uppercase.

## Screen layout

```
┌─────────────────────────────────────────────────────────┐
│ FLIGHTS/RES        AREA A          MON 10MAR26 1430Z    │  <- header bar (green bg)
├─────────────────────────────────────────────────────────┤
│                                                         │
│  scrollable content area                                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│─ 42 OFFERS ──────────────────────────────── ) MORE ─────│  <- status bar
│> 1AMSNRT10MAR                                           │  <- input line
└─────────────────────────────────────────────────────────┘
```

- **Header**: app name, active session name (or "AREA A"), spinner during search, current date/time in Zulu
- **Content**: search results, details, help text — scrollable via `MD`/`MU` or PgUp/PgDn
- **Status bar**: result count, filter status, errors. Shows `) MORE` when content overflows
- **Input line**: `>` prompt, uppercase-forced input

## Commands

### Search (availability)

```
1AMSNRT10MAR                 One-way AMS to NRT on 10 Mar
1AMSNRT10MAR*20MAR           Round-trip, return 20 Mar
1AMSNRT10MAR/C               Business class
1AMSNRT10MAR/F               First class
```

Dates use `DDMMM` format (e.g., `10MAR`, `25DEC`). If the date has passed this year, next year is assumed.

Cabin class suffix: `/Y` economy (default), `/W` premium economy, `/C` business, `/F` first.

### Search options

Append to any search command:

| Option | Example | Description |
|--------|---------|-------------|
| `/P` | `/P2AD1CH` | Passengers: 2 adults, 1 child. Supports `AD`, `CH`, `IS` (infant in seat), `IL` (infant on lap) |
| `/X` | `/X0` | Max stops (`0` = direct only) |
| `/$` | `/$USD` | Currency code |
| `/A` | `/AKL` | Filter by 2-letter airline code |
| `/DA` | `/DA0800` | Depart after 08:00 |
| `/DB` | `/DB1400` | Depart before 14:00 |
| `/AA` | `/AA1000` | Arrive after 10:00 |
| `/AB` | `/AB2200` | Arrive before 22:00 |
| `/DM` | `/DM600` | Max duration in minutes |
| `/SP` | `/SP` | Sort by price |
| `/SD` | `/SD` | Sort by duration |
| `/SS` | `/SS` | Sort by stops |
| `/ST` | `/ST` | Sort by departure |
| `/L` | `/L20` | Limit results |
| `/R` | `/R` | Force refresh (skip cache) |

Options can be combined: `1AMSNRT10MAR/C/X0/$USD/DA0800`

### Date matrix

```
DMAMSNRT10MAR-14MAR                    One-way date range
DMAMSNRT10MAR-14MAR*17MAR-21MAR        Round-trip date ranges
DMAMSNRT10MAR-14MAR/C/$USD             With cabin/currency options
```

Searches each date (or date combination for round-trip) and shows the cheapest price per cell. Round-trip is capped at 21 combinations.

### Inspect offer

```
*1                           Show details for offer 1
*5                           Show details for offer 5
```

Displays legs, aircraft, departure/arrival times, layover details, seat pitch, operator info, and total price.

### Airport search

```
AN TOKYO                     Search airports by city name
AN NRT                       Lookup by IATA code
AN SCHIPHOL                  Search by airport name
```

Returns up to 10 matching airports with code, name, city, and country.

### Filters (post-search)

Apply to the current search results:

| Command | Description |
|---------|-------------|
| `QD` | Direct flights only |
| `QX1` | Max 1 stop |
| `QAKL` | Filter by carrier (2-letter IATA code) |
| `QDA0800` | Depart after 08:00 |
| `QDB1400` | Depart before 14:00 |
| `QAA1000` | Arrive after 10:00 |
| `QAB2200` | Arrive before 22:00 |
| `QM600` | Max duration (minutes) |
| `QC` | Clear all filters |

### Sort (post-search)

| Command | Description |
|---------|-------------|
| `SP` | Sort by price |
| `SD` | Sort by duration |
| `SX` | Sort by stops |
| `ST` | Sort by departure time |

### Itinerary

Build a multi-leg itinerary from offer references:

```
IT Fa3b7 Fc1d2               Combine offers from current search
IT REF1:Fa3b7 REF2:Fc1d2    Combine offers across searches
```

Shows legs, connections, gap warnings, and total price.

### Session management

| Command | Description |
|---------|-------------|
| `SS/` | Show session status |
| `SS/START` | Start new session (auto-named) |
| `SS/START Tokyo Trip` | Start named session |
| `SS/CLOSE` | Close active session |
| `SS/LIST` | List all sessions |
| `SS/RENAME name` | Rename active session |

The active session name appears in the header bar. Sessions track search history for takeout export.

### Config

| Command | Description |
|---------|-------------|
| `CF/` | Show all config |
| `CF/CURRENCY` | Show one key |
| `CF/CURRENCY=USD` | Set a key |
| `CF/CURRENCY=` | Unset a key |

Valid keys: `CURRENCY`, `FMT`, `SEAT`, `PAX`, `LIMIT`.

### Takeout (export)

```
TO                           Export session searches to ~/Desktop
TO/TITLE My Tokyo Trip       Export with custom title
```

Exports a Markdown document with all searches from the active session.

### Navigation and system

| Command | Description |
|---------|-------------|
| `MD` | Scroll down one page |
| `MU` | Scroll up one page |
| `MT` | Scroll to top |
| `MB` | Scroll to bottom |
| `XI` | Clear display (return to splash) |
| `H/` | Show full command reference |
| `H/SEARCH` | Search syntax help |
| `H/FILTER` | Filter/sort help |
| `H/SESSION` | Session help |
| `H/MATRIX` | Matrix help |
| `H/ITINERARY` | Itinerary help |
| `H/TAKEOUT` | Takeout help |
| `H/CONFIG` | Config help |
| `/SO` | Sign off (exit) |

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Up/Down | Browse command history |
| PgUp/PgDn | Scroll content |
| Ctrl+L | Redraw screen |
| Ctrl+U | Clear input line |
| Ctrl+C | Exit |
| Backspace | Delete last character |
| Enter | Execute command |

## Dependencies

- `@flights/core` (workspace) -- flight search engine
- `terminal-kit` -- fullscreen terminal rendering
