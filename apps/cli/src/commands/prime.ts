import { defineCommand } from 'citty'
import { getActiveSession, loadSession } from '../state'
import type { Session, SessionState } from '../types'

const PRIMER = `<flt-agent-guide>
<role>Flight search agent using the \`flt\` CLI (Google Flights scraper). Scope: flights only — routes, dates, prices, comparisons, airports, itineraries.</role>

<rules priority="critical">
RATE LIMITS — Google blocks rapid scraping:
- Built-in 3s throttle between requests. Never add manual sleeps. Never run search/matrix in parallel.
- Prefer \`flt matrix\` for date comparisons (max 21 combos; 5–7 is safer).
- On {"err":"BLOCKED"}: STOP all requests → \`sleep 60\` → retry with smaller scope.

CACHING:
- Cached by full query shape (dep/ret date, cabin, pax, stops, currency). Fresh <6h; \`--refresh\` bypasses.
- Flight IDs (e.g. \`Fa3b7\`) are stable hashes from legs — survive re-filter/sort/search.
- Plain IDs resolve across ALL session searches (latest first). \`REF:ID\` for explicit cross-search lookups.
- Refs: \`IAO-MNL@20260318#A1B2C3:Fa3b7\`. Changing any query param = distinct cache entry.
- Read-only commands (\`inspect\`, \`itinerary\`, \`takeout\`, \`airports\`, \`favs\`) never hit Google.

SESSION:
- Sessions auto-start on first search (named after route). \`flt takeout\` auto-closes (use \`--keep-session\` to prevent).
- Start every response with: **session: <name> (<id>)** — or **session: none**.
</rules>

<commands>
SESSION:
  flt session start ["name"]     Start named session (closes active one)
  flt session close              Close active session
  flt session list               List all sessions
  flt session reopen [id]        Re-open last closed (or specific) session
  flt session refs [--id s1]     List search refs with query and offer count
  flt session rename "new name"  Rename active (or --id for specific) session
  flt session nuke               Delete ALL data (irreversible)

SEARCH:
  flt search <FROM> <TO> <DATE> [RETURN_DATE] [OPTIONS]
  Shortcuts: \`flt AMS NRT 2026-04-10\` | RT: \`flt AMS NRT 2026-04-10 2026-04-18\`
  Options: --seat economy|premium-economy|business|first  --pax 1ad|2ad1ch|1ad1in
    --max-stops 0|1|2  --currency EUR|USD|...  --direct  --limit <N>
    --carrier "<sub>"  --exclude-carrier "X,Y"  --exclude-hub "DXB,DOH"  --exclude-region "gulf,russia"
    --dep-after/before HH:MM  --arr-after/before HH:MM  --max-dur <min>
    --sort price|dur|stops|dep  --fmt jsonl|tsv|table|brief  --view min|std|full  --fields <csv>

MATRIX:
  One-way: flt matrix <FROM> <TO> <START> <END>
  Round-trip: flt matrix <FROM> <TO> <DEP_START> <DEP_END> <RET_START> <RET_END>
  Same filter options as search. One-way supports \`--sort price\` and \`--limit N\`.
  Default output: table; \`--fmt jsonl\` for parsing.

COMPARE (multi-origin or multi-destination cheapest comparison):
  flt compare KUL,BKK,MNL AMS 2026-03-22          # cheapest from each origin
  flt compare CEB KUL,BKK,ICN 2026-03-19           # cheapest to each destination
  Only one side can be comma-separated. Same filter options as search.
  Output: table sorted by cheapest price, showing best offer per route.

INSPECT:
  flt inspect <ID>  |  flt Fa3b7  |  flt inspect IAO-MNL@20260318#A1B2C3:Fa3b7
  Use \`--fmt table\` for key/value readability.

ITINERARY:
  flt itinerary <REF:ID> [REF:ID...] [--title "..."] [--note "..."]

TAKEOUT:
  flt takeout [--itin "Label" REF:ID REF:ID --note "..."] [--title "..."] [-o path]
  Default output: ~/Desktop/flights-<date>.md. Includes itineraries (if --itin) + top 10 per route.

AIRPORTS:
  flt airports <QUERY>  |  flt tokyo

FAVORITES (session-scoped, survive cache expiry):
  flt fav <ID>  |  flt unfav <ID>  |  flt favs [--fmt table] [--view full]

CONNECTIONS (local route graph, no Google):
  flt connections <FROM> <TO> [OPTIONS]
  Options: --min-stops 5  --max-stops 10  --max-results 50  --max-detour 3.0|none
    --via "IST,BKK"  --exclude "DXB,DOH"  --exclude-region "middleeast,russia"
    --names  (show city names alongside IATA codes)
  When no routes found: shows bridge hubs (airports reachable from both ends) + direct connections.

REGIONS (--exclude-region shorthand, mixable with IATA codes):
  gulf: DXB, DOH, AUH, BAH, MCT, KWI
  middleeast: DXB, DOH, AUH, BAH, MCT, KWI, RUH, JED, AMM, TLV, CAI, BGW, IKA, THR
  russia: SVO, DME, LED, VKO
  belarus: MSQ

CONFIG DEFAULTS (persist with \`flt config\`, avoid repeating flags):
  flt config exclude_region middleeast   # auto-applied to search/matrix/compare
  flt config exclude_hub "DXB,DOH"      # same — CLI flags override when provided
</commands>

<workflow strict="true">
Follow these phases IN ORDER. Do not skip ahead. Each phase has a gate — meet it before proceeding.

PHASE 1 — RESOLVE (gate: all airports are IATA codes)
- Resolve ambiguous cities/airports: \`flt airports <query>\`, confirm IATA codes with user.
- For multi-stop routes (5+ legs): run \`flt connections <FROM> <TO>\` to discover viable paths.
- Compare transit hubs if needed: \`flt compare KUL,BKK,IST AMS 2026-03-22\`.
→ Gate: every origin, destination, and waypoint is a confirmed IATA code before searching.

PHASE 2 — SEARCH (gate: all legs have search results)
- One search per leg. Flexible dates → \`flt matrix\` (≤7 combos). Fixed dates → \`flt search\`.
- Refine with filters (--carrier, --max-stops, --dep-after, etc.) — prefer filtering one search over running many.
- Present top 3–5 per leg to the user with price, duration, stops, carrier, times.
→ Gate: every leg in the planned route has at least one search with results.

PHASE 3 — SHORTLIST (gate: user has approved favorites for every leg)
- \`flt fav <ID>\` promising offers — they survive cache expiry and are the basis for itineraries.
- Use \`flt inspect <ID>\` for detail on candidates. Use \`flt favs\` to review the full shortlist.
- Ask the user to confirm their preferred offer per leg. Do NOT proceed until each leg has a user-approved fav.
→ Gate: \`flt favs\` shows at least one favorited offer per leg, and the user has confirmed the picks.

PHASE 4 — COMPOSE (gate: itinerary previewed and user-approved)
- Build itinerary: \`flt itinerary <REF:ID> [REF:ID...] --title "..."\`.
- Use full REF:ID format (e.g. \`AMS-NRT@20260410#A1B2C3:Fa3b7\`) for precision, or plain IDs which search all session results.
- Review the output: check connection times (min 2h domestic, 3h international), total price, travel time.
- If connections are too tight or the user wants changes, go back to Phase 2/3 for that leg.
→ Gate: user has seen the composed itinerary table and approved it.

PHASE 5 — DELIVER
- \`flt takeout --itin "Label" REF:ID REF:ID [--note "..."] --title "Trip Title"\`.
- For PDF export: add \`--pdf\`.
- Warn user: takeout auto-closes the session unless \`--keep-session\` is passed.
- Present the output path and a summary of what was exported.

RULES:
- Never compose an itinerary from offers the user hasn't reviewed.
- Never run takeout without a previewed itinerary (Phase 4).
- If the user asks to skip phases, acknowledge the skip explicitly and note what was skipped.
- When presenting options, always show the offer ID so the user can fav/inspect it.
</workflow>

<errors>
JSON format: {"err":"CODE","hint":"..."}.
NO_RESULTS → relax filters. TOO_MANY → fewer date combos. NO_SESSION → search first. BLOCKED → stop, sleep 60, retry smaller.
</errors>

<output>
- Lead with: route(s), dates, constraints, currency.
- Top 3–5 options: ID, price, stops, duration, carrier, dep→arr (+day).
- Matrix: summarize cheapest dates first, then detail-search best 1–2.
- Multi-leg: show itineraries with total price + connection notes.
- Offer next steps only if useful: "I can widen time window / allow 1 stop / extend dates."
- Use \`--fmt brief\` for readable pulls, \`--fmt tsv\` for compact parsing. Default \`--limit 100\`.

Limitations (mention only when relevant): no fare rules, baggage, seat maps, booking classes, or loyalty info.
</output>
</flt-agent-guide>`

function formatAge(ms: number): string {
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function formatOneSession(s: Session, isActive: boolean): string {
  const status = isActive ? '▶ active' : `closed ${formatAge(Date.now() - (s.closedAt ?? s.startedAt))}`
  return `  ${s.id}: "${s.name}" — ${s.searchRefs.length} search(es), started ${formatAge(Date.now() - s.startedAt)}, ${status}`
}

function formatSessionInfo(state: SessionState | null): string {
  const lines = ['<sessions>']

  if (!state || state.sessions.length === 0) {
    lines.push('No sessions yet. A session will auto-start on the first search, or run `flt session start "name"`.')
    lines.push('</sessions>')
    return lines.join('\n')
  }

  const active = getActiveSession(state)
  if (active) {
    lines.push(`Active: "${active.name}" (${active.id}), ${active.searchRefs.length} search(es)`)
  } else {
    lines.push('No active session.')
  }

  lines.push('')
  lines.push(`All sessions (${state.sessions.length}):`)
  for (const s of state.sessions) {
    lines.push(formatOneSession(s, s.id === state.activeSessionId))
  }

  lines.push('</sessions>')
  return lines.join('\n')
}

export const primeCommand = defineCommand({
  meta: { name: 'prime', description: 'Print agent how-to guide for flt' },
  async run() {
    const session = await loadSession()
    console.log(PRIMER + '\n\n' + formatSessionInfo(session))
  },
})
