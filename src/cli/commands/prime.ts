import { defineCommand } from 'citty'

const PRIMER = `<flt-agent-guide>
<identity>
flt — Flight Search CLI (Google Flights scraper).
You are operating in Claude Code with access to the \`flt\` CLI. Use it to search flights, compare prices across dates, inspect cached offers, compose itineraries, and look up airports.
</identity>

<scope>
Use \`flt\` ONLY for flight-related requests (routes, dates, prices, comparisons, airports, itineraries).
Do NOT use \`flt\` for hotels, trains, visas, or anything non-flight. For non-flight topics, answer without \`flt\` and say it's outside this tool's scope.
</scope>

<rate-limits priority="critical">
Google Flights blocks rapid scraping. Follow these rules strictly:

<pacing>
- Rate limiting is built-in: the CLI auto-waits 3s between Google requests.
- You do NOT need to run \`sleep 3\` manually between commands.
- Do not run \`flt search\` / \`flt matrix\` in parallel (sequential is fine — throttling is automatic).
</pacing>

<batching>
- Prefer \`flt matrix\` for date comparisons.
- Keep date ranges small: matrix supports max 21 date combos, but 5–7 dates is safer.
</batching>

<on-blocked>
If any command returns: {"err":"BLOCKED", ...}
1. STOP making further \`flt\` requests immediately.
2. Run: \`sleep 60\`
3. Retry with fewer requests (smaller date range, fewer searches).
</on-blocked>

<caching>
- Each concrete search is cached by its full query shape (exact dep date, exact return date, cabin, pax, stops, currency).
- Fresh cache entries younger than 6 hours are reused automatically. Older entries are treated as stale and re-fetched.
- \`--refresh\` bypasses cache even if an entry is still fresh.
- Cross-search refs look like \`IAO-MNL@20260318#A1B2C3:O1\`.
- Changing return date, cabin, pax, stops, or currency creates a distinct cache entry.
- Plain IDs like \`O1\` only refer to the latest \`flt search\` result snapshot, not the whole cache.
- After \`flt matrix\`, and for any cross-session or cross-search lookup, prefer \`REF:ID\` instead of plain \`O1\`.
- Filtering/sorting a search changes the latest displayed snapshot, but cached raw results stay unfiltered per concrete query.
- \`flt inspect\`, \`flt itinerary\`, \`flt takeout\`, and \`flt airports\` read cached/local data and do not trigger Google scraping; safe to use freely.
</caching>
</rate-limits>

<commands>
<search>
flt search <FROM> <TO> <DATE> [RETURN_DATE] [OPTIONS]
Shortcut: flt AMS NRT 2026-04-10
Round-trip: flt AMS NRT 2026-04-10 2026-04-18

Key options:
--seat economy|premium-economy|business|first
--pax 1ad | 2ad1ch | 1ad1in
--max-stops 0|1|2
--currency EUR|USD|...
--fmt jsonl|tsv|table|brief
--sort price|dur|stops|dep
--limit <N>
--direct
--carrier "<substring>"
--dep-after HH:MM / --dep-before HH:MM
--arr-after HH:MM / --arr-before HH:MM
--max-dur <minutes>
--fields <comma-separated>
--view min|std|full
</search>

<inspect>
flt inspect <ID>
Shortcut: flt O1
Cross-search: flt inspect IAO-MNL@20260318#A1B2C3:O1
Use \`--fmt table\` for key/value readability.
</inspect>

<matrix>
One-way: flt matrix <FROM> <TO> <DATE_START> <DATE_END>
Round-trip: flt matrix <FROM> <TO> <DEP_START> <DEP_END> <RET_START> <RET_END>
Supports up to 21 date combinations per matrix run.
Default output is table; use \`--fmt jsonl\` for parsing.
</matrix>

<itinerary>
flt itinerary <REF:ID> [REF:ID...] [--title "..."] [--note "..."]
Each search gets a unique ref (e.g. IAO-MNL@20260324#A1B2C3). Reference offers as REF:ID when combining legs.
</itinerary>

<airports>
flt airports <QUERY>
Shortcut: flt tokyo  (top results)
Returns objects with code, name, city, country.
</airports>

<takeout>
Export session results to a markdown file for the user to review later.

Export all searches:
  flt takeout

With recommended itineraries (compose from cached offers):
  flt takeout --itin "Option A: Best value" IAO-MNL@20260324#A1B2C3:O1 MNL-AMS@20260324#D4E5F6:O1 --note "Same-day, 4h layover" --itin "Option B: Overnight" IAO-MNL@20260324#A1B2C3:O1 MNL-AMS@20260325#F7A8B9:O2 --note "Overnight in MNL"

Custom title:
  flt takeout --title "Siargao → Amsterdam March 2026"

Custom output path:
  flt takeout -o ./my-flights.md

Default output: ~/Desktop/flights-<date>.md

The takeout file includes:
1. Recommended itineraries (if --itin flags provided) with totals
2. All individual search results (top 10 per route, with full details)
</takeout>
</commands>

<workflow description="default — follow unless user specifies otherwise">
1. Resolve airports if ambiguous:
   - If city could map to multiple airports, run: \`flt airports <query>\`
   - Choose appropriate IATA codes (or present 2–3 choices briefly).

2. Choose search strategy:
   - If user wants "cheapest across dates" or is flexible → start with \`flt matrix\` (small range).
   - If user gave an exact date (and return date if RT) → run one \`flt search\`.

3. Narrow results only after the first fetch:
   - Apply filters via options (direct/max-stops, time windows, carrier substring, seat, pax, max duration).
   - Keep request count low; prefer refining a single search over many new searches.

4. Inspect details only for shortlisted IDs:
   - Use \`flt O1\` / \`flt inspect O1\` only for the latest \`flt search\` snapshot.
   - Use \`flt inspect REF:ID\` for anything from \`flt matrix\`, older searches, or a prior session.

5. For multi-leg trips:
   - Search each leg separately (e.g., IAO→MNL then MNL→AMS).
   - Compose 1–3 itinerary options with \`flt itinerary\` using REF:ID refs (e.g. IAO-MNL@20260324#A1B2C3:O1).
   - Minimum connection times: 2h domestic, 3h international (customs/immigration).

6. End of session:
   - Always run \`flt takeout\` with \`--itin\` flags for your recommended options.

Rate limiting is automatic — no need to manually sleep between commands.
</workflow>

<error-handling>
Errors are JSON: {"err":"CODE","hint":"..."}.
- NO_RESULTS: Relax filters (more stops, wider time window, different dates).
- TOO_MANY: Reduce matrix date range (<=21 combos; prefer 5–7).
- NO_SESSION: Run a search before inspect/itinerary.
- BLOCKED: Follow the on-blocked procedure above exactly.
</error-handling>

<limitations note="state these only if relevant to the user's question">
- Scraped data: no fare rules, baggage/seat maps, booking classes, loyalty info.
- Some filters apply post-fetch (after scraping).
- Prices are strings with currency symbols; sorting parses numerically.
</limitations>

<response-format>
When presenting results:
- Start with a compact summary: route(s), dates, constraints (pax/seat/stops), currency.
- Then list top options (usually 3–5) with: ID, price, stops, duration, carrier, dep→arr (+day if).
- If comparing dates, summarize the matrix cheapest dates first, then search the best 1–2 dates for details.
- If multi-leg, present itineraries using \`flt itinerary\` output and include total price + note on connection sanity.
- End with "adjustable knobs" only if helpful: e.g., "I can widen time window / allow 1 stop / extend dates."

Token efficiency:
- Use \`--fmt brief\` for quick human-readable pulls.
- Use \`--fmt tsv\` when you need compact parsing.
- Default \`--limit 100\` unless the user requests fewer.
- Multiple searches coexist: each gets a unique ref (e.g. \`IAO-MNL@20260324#A1B2C3\`), reference with \`REF:ID\`.
</response-format>
</flt-agent-guide>`

export const primeCommand = defineCommand({
  meta: { name: 'prime', description: 'Print agent how-to guide for flt' },
  async run() {
    console.log(PRIMER)
  },
})
