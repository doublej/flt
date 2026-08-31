/** Every user-facing string on the site, in English. Components read from here
 *  instead of carrying their own copy, so a second language is a second file
 *  checked against `Messages` rather than a sweep back through the markup.
 *
 *  Three rules hold this file together.
 *
 *  A measured figure is never written into a string. Every number this site
 *  claims came off a real run and lives in `scenarios.ts` or `tiers.ts`, so a
 *  string that shows one is a function taking it as a parameter and the call
 *  site keeps passing the derived value. A translation can then move the words
 *  around the number without ever being able to change the number. The handful
 *  of figures spelled out below are ones the page has always hard-coded; they
 *  are marked where they appear.
 *
 *  A non-breaking space is written `\u00a0`, never `&nbsp;`. These strings are
 *  interpolated as text rather than as markup, so an HTML entity would render
 *  as its own six characters, and a literal U+00A0 here would be invisible to
 *  anyone editing the line. The escape is load-bearing: it is what stops "New
 *  York" and "By hand" breaking across a heading's lines.
 *
 *  Keys are named for where the string sits and what it is, so the groups below
 *  follow the section ids in `+page.svelte` rather than the components. A
 *  component used in exactly one band has its copy in that band's group.
 */

/** One rule about counting searches, three views of it below. Kept out of the
 *  object so `searchCount` can be built from the other two rather than
 *  restating them — a locale where the plural or the estimate mark differs
 *  changes it in one place. */
const searchMark = (n: number): string => (n === 1 ? '' : '~')
const searchUnit = (n: number): string => (n === 1 ? 'search' : 'searches')

export const en = {
  /** `app.html` and the `<svelte:head>` in `+layout.svelte`, including the
   *  JSON-LD an answer engine reads back aloud. */
  meta: {
    title: 'Bureau — flight research for people with flexible dates',
    description:
      'Tell us where you want to go and roughly when. Bureau prices every date you could fly, ranks what comes back and sends you one report with a link to book each option. From €3, and we never book or ticket anything.',
    orgName: 'Bureau',
    orgDescription:
      'A paid flight research service. Bureau searches every route and date combination in a brief and returns a PDF report with price charts, ranked options and booking links. It does not sell, book or ticket flights.',
    siteName: 'Bureau',
    serviceName: 'Bureau flight research report',
    serviceType: 'Flight research report',
    serviceDescription:
      'You brief a route and rough dates. Bureau runs the searches one at a time and sends back a PDF report: price-by-date charts, ranked options with airline, routing and total journey time, and a booking link for each. Prices come from public flight search results at the time of the search, not an airline feed. Bureau does not book or ticket flights.',
  },

  nav: {
    brand: 'Bureau',
    howItWorks: 'How it works',
    pricing: 'Pricing',
    brief: 'Start a brief',
  },

  hero: {
    /** Each headline names one route that is also a row on the flap board, and
     *  the board swaps that row to the top while its headline is up. The figure
     *  is deliberately not written here: it is that route's own high - low out
     *  of `scenarios.ts`, so the number set in display type and the number on
     *  the board cannot drift apart. Same reasoning as `tiers.ts`.
     *
     *  `route` is a lookup key into SPREADS, not display copy — it must stay
     *  byte-identical to the `route` strings in `scenarios.ts`, arrow and all.
     *  Do not translate it. `kicker` and `clause` are translatable.
     *
     *  Ordered big, small, big, small on purpose: what a flexible week is worth
     *  swings from €147 to €37 across these four, and the rotation is the only
     *  place on the page that argument is made by rhythm rather than by prose. */
    headlines: [
      { route: 'Amsterdam → New York JFK', kicker: 'Amsterdam · New York' },
      { route: 'Amsterdam → Innsbruck', kicker: 'Amsterdam · Innsbruck' },
      { route: 'Amsterdam → Singapore', kicker: 'Amsterdam · Singapore' },
      { route: 'Amsterdam → Turin', kicker: 'Amsterdam · Turin' },
    ],
    /** Follows the figure, and is the same for all four — the number and the
     *  route change, the claim does not. */
    clause: 'between the cheapest departure date and the dearest',
    /** No longer takes the spread: the headline above it now sets that figure in
     *  156px of display type, and saying it again one line down read as a stutter.
     *
     *  "A thousand" is prose and prospective, and it is the one round number on
     *  the page — but it is not a round-up. It is what a Survey-sized brief
     *  actually returned in the runs: 1,060 options on the Singapore job and
     *  1,172 on the holidays job, both in `scenarios.ts`. Not `TOTALS.options`,
     *  which is 2,942 across four finished briefs and would claim that per
     *  brief. If those scenarios are ever re-run and the figure falls, this
     *  sentence has to change with them. */
    pitch:
      'Let our agents compare a thousand flights and bring you the handful worth comparing and deciding on. Reports from €3.',
    ctaBrief: 'Start a brief',
    ctaHow: 'See how it works',
    /** The lit sign and the flap rows on the board inside the photograph. The
     *  drums only carry ' A-Z0-9.-/', so a translation of these three has to
     *  survive `toFlaps` — anything outside that alphabet is dropped, not
     *  substituted. */
    boardSign: 'Cheapest day by route',
    boardFare: (fare: number) => `EUR ${fare}`,
    boardSave: (spread: number) => `SAVE ${spread}`,
  },

  weekband: {
    heading: (best: number) =>
      `Seven departure dates, up to €${best} between the best one and the worst`,
    body: (best: number, worst: number) =>
      `Nine real routes, each priced on all seven departure dates in its window. Moving your dates was worth €${best} on New\u00a0York and €${worst} on Lyon, and nothing about either route said which it would be in advance. The New York answer cost €10.`,
    ctaBrief: 'Start a brief, from €3',
    ctaHow: 'See how it works',
    proof: (queries: number, options: string, carriers: number, seconds: number) =>
      `${queries} searches · ${options} options · ${carriers} airlines · ${seconds} seconds`,
    /** WeekBoard. */
    boardWindow: 'every departure date',
    /** The three fares sit in their own <b> mid-sentence, so this is the one
     *  line on the site that had to be split at its emphasis boundaries rather
     *  than kept whole: putting the tags in the string would put a CSS class
     *  name in the language file. The punctuation travels with the fragment it
     *  follows. */
    boardFootLead: 'Cheapest day',
    boardFootDearest: ', dearest',
    boardFootWorth: '— being flexible was worth',
    boardFootTail: 'on this route. One-way economy.',
  },

  evidence: {
    heading: (best: number, worst: number) =>
      `The right departure date was worth €${best} on New\u00a0York and €${worst} on Lyon`,
    lead: (paidForItself: number, routes: number, timesOver: number) =>
      `Every route here was searched on all seven of its departure dates, so the spread is exactly what moving your dates would have saved you. ${paidForItself} of the ${routes} returned more than the €10 we charge to look, and the best of them returned ${timesOver} times it. You cannot tell which kind of route you have until someone checks.`,
    kicker: (
      economyLow: number,
      economyHigh: number,
      premiumFlat: number,
      overDearest: number,
      overCheapest: number,
    ) =>
      `Cabin makes its own point. Across that Singapore week economy moved between €${economyLow} and €${economyHigh}, while premium economy sat at €${premiumFlat} on every single day. The step up cost €${overDearest} on the dearest economy day and €${overCheapest} on the cheapest. The upgrade never moved; only the thing you were comparing it against did. Fourteen searches and 37 seconds bought that answer.`,
    /** FareRange. */
    keyPay: 'Cheapest day of the week',
    keyAdd: 'What the dearest day adds',
    colRoute: 'Route',
    colChart: 'One-way fare across the week',
    colCheapest: 'Cheapest',
    colDearest: 'Dearest',
    colSave: 'You save',
    /** "Eight of the nine" is written out here; it is `FLEX.paidForItself` of
     *  `FLEX.routes` in words. */
    fareNote:
      'Every route was searched on all seven of its departure dates, and the bars share one scale, so the Alpine routes really are that much cheaper than the Atlantic ones. The percentage is the saving measured against the cheapest fare, which is why Innsbruck beats New York on flexibility while costing a tenth as much. Eight of the nine spreads beat the €10 a Survey costs. One-way economy fares, the cheapest showing when we looked.',
  },

  work: {
    /** Seventy-five, 200 and two hours are `TOTALS.queries`,
     *  `TOTALS.searchingSeconds` and `byHandHours(TOTALS.queries)`, written out
     *  in words and rounded. */
    heading: 'Seventy-five searches took us 200 seconds. By\u00a0hand they take two hours.',
    lead: 'Four briefs, seventy-five searches. One search is one route priced on one date, so a brief that leaves both open is not one question but dozens — and dozens is exactly where a row of browser tabs stops being any use.',
    /** QueryGrid. The prose that used to sit on each run in `scenarios.ts`,
     *  keyed by the same scenario id so the two files cannot drift apart. */
    scenarios: {
      gateway: {
        ask: "Hanoi in November. I can train it to Brussels or Frankfurt if that's cheaper, I really don't mind.",
        rowKind: 'departure airports',
      },
      ski: {
        ask: "Somewhere with snow, third week of January? Don't mind where as long as it isn't a fortune to get to.",
        rowKind: 'destinations',
      },
      cabin: {
        ask: 'Singapore in November. Is premium economy actually worth it that week, or am I paying €500 for a bigger seat?',
        rowKind: 'cabins',
      },
      holidays: {
        ask: "New York for Christmas. Or Boston, or Philly if it's cheaper, anywhere I can get a train in from.",
        rowKind: 'destinations',
      },
    },
    countUnit: 'searches',
    shape: (rows: number, rowKind: string, cols: number) =>
      `${rows} ${rowKind} × ${cols} ${cols === 1 ? 'date' : 'dates'}`,
    jobTally: (options: string, seconds: number) => `${options} options · ${seconds} seconds`,
    /** The lead is emphasised on its own, so it is its own key. */
    totalLead: (queries: number) => `${queries} searches`,
    totalBody: (
      seconds: number,
      options: string,
      carriers: number,
      manualSeconds: number,
      queries: number,
      hours: string,
    ) =>
      `in ${seconds} seconds of actual searching, which returned ${options} options across ${carriers} airlines. Run by hand at a generous ${manualSeconds} seconds each (type the route, wait for it, scan the results, write the price down) the same ${queries} searches take about ${hours} hours. The largest of the four — twenty-eight searches across four American cities — is a €10 Survey. That by-hand estimate is the only number on this page we did not measure.`,
  },

  avoid: {
    /** €73, 113, 1,060, 50 and 135 are all in `AVOIDING`, written out here. */
    heading: 'Ruling out the Gulf cost €73 on Singapore and nothing at all on Hanoi',
    lead: 'Say you will not change planes in the Gulf. We read every option first, then take away the ones that connect there. On Singapore that took out 113 of 1,060 options and put €73 on the cheapest fare; on Hanoi it took out 50 of 135 and changed the price by nothing. You only find out which by having priced both.',
    /** AvoidHubs. */
    toggleOn: 'Gulf hubs excluded',
    toggleOff: 'Everything we found',
    toggleHint:
      'Press to drop every option that connects in Dubai, Doha, Abu Dhabi, Bahrain, Muscat or Kuwait.',
    optionCount: (options: string) => `${options} options`,
    cheapest: 'Cheapest',
    up: (added: number) => `up €${added}`,
    without: (fare: number) => `€${fare} without them`,
    unchanged: 'unchanged either way',
    hubsHeading: 'Where the connections actually happen',
    /** 2,942 is `TOTALS.options` and 66 is `LAYOVER_DISTINCT`, both written out. */
    hubsNote:
      "Connection counts across all 2,942 options, in which 66 different airports appeared. Excluding a hub matches an option's connecting airports only, so it never rules out your origin or your destination.",
  },

  routes: {
    heading: (routings: string, seconds: number) =>
      `There are ${routings} ways to reach Hanoi, and we read the map in ${seconds} seconds before pricing one of them`,
    lead: 'Every line is one way of getting from Amsterdam to Hanoi within a stop budget. Nothing here has a price on it yet. We look at what connects to what first, and then go and price the routes worth pricing.',
    /** RouteWeb. The plural rule lives with the language, not at the call site. */
    webLabel: (routings: string, stops: number) =>
      `${routings} routings within ${stops} ${stops === 1 ? 'stop' : 'stops'}`,
    webUpTo: (stops: number) => `Up to ${stops} ${stops === 1 ? 'stop' : 'stops'}`,
    webNote: (airports: string, connections: string, seconds: number, maxDetour: number) =>
      `Amsterdam to Hanoi, walked over a map of ${airports} airports and ${connections} direct connections in ${seconds} seconds. Nothing here is priced, timetabled or bookable; it is a static snapshot of what connects to what, capped at ${maxDetour}× the direct distance, and we use it to decide which routes are worth searching.`,
    /** RouteWeb tab list: one live diagram, stepped through by stop budget. */
    tabsLabel: 'Choose a stop budget',
    /** RouteWeb hub map: `HUB_SAMPLE`, six open and six ruled out. */
    hubsEyebrow: 'What ruling one out actually does',
    hubsCaption: (routings: string, withoutGulf: string) =>
      `Close the six Gulf hubs and ${routings} routings become ${withoutGulf}. Everything else on the map reroutes around them or never needed them.`,
    /** RouteWeb priced strip: one pair from `ROUTE_EXAMPLE`, actually priced. */
    pricedEyebrow: 'One line, priced',
    nonstopTag: 'Nonstop',
    viaTag: (via: string) => `via ${via}`,
    lessBy: (diff: number) => `€${diff} less`,
    pricedCaption: (date: string) => `Same search, ${date}.`,
  },

  report: {
    heading: 'How it works',
    steps: [
      {
        h: 'Send a rough brief',
        p: 'Where from, where to and roughly when. Several destinations is fine, and so is vague, because vague is the part we are good at.',
      },
      {
        h: 'We price every date',
        p: 'One search at a time, a few seconds apart, because a flight site that gets too many requests at once stops answering. It takes minutes, and you do not have to sit through them.',
      },
      {
        h: 'The report lands',
        /** €147 is a spread out of `SPREADS`, written out. */
        p: 'A PDF with the prices day by day, every option ranked by price and journey time, and a link to book each one. The last one of these found €147 between the best departure date and the worst. You book in the same place you always did.',
      },
    ],
    /** ReportShowcase, which is not mounted anywhere at the moment. Its copy
     *  lives here so it comes back translated if the component is put back. */
    showcase: {
      pagesLabel: 'Report pages',
      cover: 'Cover',
      coverCaption: 'Every route on one map, and a plain summary of what the numbers said.',
      chart: 'Price by date',
      chartCaption:
        'Per route: the lowest fare each day against the day’s average, so you can see whether a cheap day is one lucky seat or the whole day.',
      table: 'Options',
      tableCaption:
        'Ten options per date, each with airline, routing, total time, arrival day, and a booking link out.',
      pageAlt: (label: string) => `Report page: ${label}`,
    },
  },

  pricing: {
    heading: 'You pay for the searching, not the seat',
    /** €10 and €147 are both measured, written out. */
    lead: 'More dates and destinations mean more searching, and the searching is what you pay for. The New York report above cost €10 and found €147 between the best day in its window and the worst.',
    kicker:
      'One route on one fixed date? Google Flights does that free in ninety seconds — do not pay us for it. We are worth it once you have several destinations and flexible dates, where the spread is usually worth more than the fee.',
    /** PriceTiers. Keyed by the tier id in `tiers.ts`, which keeps the two
     *  figures — the price, parsed into cents by `briefAmount`, and the search
     *  count the tariff sizes its numeral off. Neither is a figure a
     *  translation may touch, so neither is written out here. */
    tiers: {
      enquiry: {
        name: 'Enquiry',
        scope: 'One route, one date.',
        time: 'under a minute',
      },
      flexible: {
        name: 'Flexible',
        scope: 'One route, up to 9 departure dates.',
        time: '1–2 minutes',
      },
      survey: {
        name: 'Survey',
        scope: 'Up to 5 destinations across a date window, economy and premium.',
        time: '3–5 minutes',
      },
    },
    tariffLegend: 'What a report costs',
    /** How English writes a search count out. One is exact and anything above
     *  it is an estimate, which is a rule about the words and not about the
     *  figure — the figure is `Tier.searches`, and none of these can change it.
     *  The tariff sets the digits apart from the word and so wants the two
     *  halves; the brief's total wants the phrase whole. */
    searchMark: searchMark,
    searchUnit: searchUnit,
    searchCount: (n: number) => `${searchMark(n)}${n} ${searchUnit(n)}`,
    tiersFoot:
      'Every tier is the same work at a different size. Return-trip date grids are capped at 21 date combinations.',
  },

  brief: {
    heading: 'Send a brief',
    lead: 'Only the destination is required. Everything else is a tap, or leave it and we will use our judgement — the vaguest briefs are the ones worth most, because they have the most dates to be wrong about. The report comes back the same day.',
    limits: [
      'We do not book or ticket anything. We find the options and hand you the links.',
      'Prices come from public flight search results rather than from the airlines, so they are what was showing when we looked and they can move before you book.',
      'Display price only, with no baggage rules, fare conditions or tax breakdown.',
      'The engine is a public command-line tool called flt. It is on GitHub, and you are welcome to run it yourself and skip us entirely.',
    ],
    /** BriefForm. Each chip list is also what gets posted to `/api/checkout`
     *  and read by the back office, so translating a chip translates the brief
     *  the researcher receives. The last origin is the escape hatch that opens
     *  the free-text airport field. */
    origins: ['Amsterdam', 'Brussels', 'Paris', 'Düsseldorf', 'Frankfurt', 'Somewhere else'],
    lengths: ['A long weekend', 'A week', 'Two weeks', 'Longer', 'One way'],
    dates: ['Exact dates', 'Give or take a few days', 'Any week that month'],
    cabins: ['Economy', 'Premium economy', 'Business'],
    priorities: [
      'Price',
      'Fewest stops',
      'Shortest journey',
      'Daytime flights',
      'Bag included',
      'An airline I know',
    ],
    dislikes: [
      'Overnight flights',
      'Layovers over four hours',
      'Low-cost carriers',
      'Departures before 8am',
      'Changing airport in a city',
    ],
    dealbreakers: [
      'More than one stop',
      'Gulf hubs',
      'Overnight layovers',
      'Landing after midnight',
      'Separate tickets',
    ],
    toLabel: 'Where do you want to go?',
    toPlaceholder: 'Vietnam. Or Hanoi. Or anywhere warm in November.',
    fromLabel: 'Where from',
    elsewhereLabel: 'Which airport',
    elsewherePlaceholder: 'Berlin',
    monthLabel: 'Which month',
    lengthLabel: 'How long',
    moreSummary: 'Fussy about anything?',
    moreHint: (dates: string, cabin: string) => `Optional — ${dates}, ${cabin}, no other rules`,
    datesLabel: 'Your dates',
    cabinLabel: 'Cabin',
    prioritiesLabel: 'What matters most, in the order you tap them',
    dislikesLabel: 'Rather not',
    dealbreakersLabel: 'Dealbreakers',
    notesLabel: 'Anything else',
    notesPlaceholder: 'Optional. We read every word of it.',
    emailLabel: 'Where the report goes',
    emailPlaceholder: 'you@example.com',
    total: (name: string, searches: string) => `${name} · ${searches}`,
    payBusy: 'Opening checkout…',
    pay: (price: string) => `Pay ${price}`,
    note: (time: string) =>
      `You finish on Stripe's checkout — card, Apple Pay or Google Pay, and a voucher code if you have one. We never see the card. The report lands in your inbox in about ${time}.`,
    /** What the customer sees on Stripe's own checkout page. */
    checkoutLineItem: (name: string) => `Bureau — ${name} report`,
  },

  status: {
    title: 'Bureau — your report',
    brand: 'Bureau',
    missing: 'We cannot find that job. Check the link in your receipt.',
    eyebrow: (tier: string, job: string) => `${tier} · job ${job}`,
    count: (done: number, total: number) =>
      `${done} of ${total} searches · the searches are deliberately spaced out, so this takes minutes`,
    open: 'Open your report',
    looking: 'Looking up your job…',
  },

  footer: {
    line: 'Bureau — flight research reports. We find the flights; you book them.',
    github: 'The engine on GitHub',
  },

  /** Everything the browser is ever shown when something goes wrong. The first
   *  four come back from `/api/checkout`; the last is the form's own fallback
   *  for when that request never lands. */
  errors: {
    badTier: 'That is not one of the three tiers.',
    noEmail: 'We need an email address to send the report to.',
    noDestination: 'Tell us where you want to go.',
    noCheckoutUrl: 'Stripe did not hand back a checkout page.',
    checkoutUnreachable: 'We could not reach the checkout. Try again in a moment.',
  },
}

/** A second locale is a module of this exact shape, so TypeScript catches a
 *  missing key or a function that lost a parameter rather than the page doing
 *  it in front of a customer. */
export type Messages = typeof en
