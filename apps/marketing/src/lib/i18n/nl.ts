import type { Messages } from './en'

/** Dutch. Checked against `Messages`, so a missing key or a function that lost
 *  a parameter is a type error here rather than a blank spot on the page.
 *
 *  Register: zakelijk maar niet stijf — plain, direct business Dutch, no
 *  marketing-Dutch, no exclamation marks. `je`/`jouw` throughout, never `u`,
 *  matching the English original's informal, direct address.
 *
 *  Two things this file must never touch, same as `en.ts`:
 *
 *  `hero.headlines[].route` stays byte-identical to the `route` strings in
 *  `scenarios.ts` — it is a lookup key, not copy. `scenarios.ts` itself (its
 *  `route` and `window` fields) also stays English: both are string-matched
 *  and regex-parsed elsewhere, so translating them breaks the match rather
 *  than just reading oddly. That is known debt, not something to fix here —
 *  it means the flap board's day column reads e.g. "22 DEC" on this page too.
 *
 *  A measured figure is still never written into a string; every function
 *  below takes the same parameters as its English counterpart, in the same
 *  order, so a translation can move words around a number but never reach it.
 *
 *  ` ` marks the same non-breaking spaces as the English file, moved to
 *  wherever the Dutch phrase would otherwise let a short trailing word orphan
 *  onto its own line. */

/** Same rule as `en.ts`: the mark and the unit live with the language. */
const searchMark = (n: number): string => (n === 1 ? '' : '~')
const searchUnit = (n: number): string => (n === 1 ? 'zoekopdracht' : 'zoekopdrachten')

export const nl: Messages = {
  meta: {
    title: 'Bureau: vluchtonderzoek voor wie flexibele reisdata heeft',
    description:
      'Je geeft aan waar je heen wilt en ongeveer wanneer. Bureau prijst elke datum waarop je zou kunnen vliegen, rangschikt wat dat oplevert en stuurt je één rapport met een boekingslink per optie. Vanaf €3, en we boeken of ticketen zelf nooit iets.',
    orgName: 'Bureau',
    orgDescription:
      'Een betaalde vluchtonderzoeksdienst. Bureau doorzoekt elke route- en datumcombinatie in een briefing en levert een PDF-rapport met prijsgrafieken, gerangschikte opties en boekingslinks. Bureau verkoopt, boekt of ticket geen vluchten.',
    siteName: 'Bureau',
    serviceName: 'Bureau vluchtonderzoeksrapport',
    serviceType: 'Vluchtonderzoeksrapport',
    serviceDescription:
      'Je brieft een route en ruwe data. Bureau voert de zoekopdrachten één voor één uit en stuurt een PDF-rapport terug: prijs-per-datum-grafieken, gerangschikte opties met maatschappij, routering en totale reistijd, en per optie een boekingslink. Prijzen komen uit publieke vluchtzoekresultaten op het moment van zoeken, niet uit een feed van de maatschappij. Bureau boekt of ticket geen vluchten.',
  },

  nav: {
    brand: 'Bureau',
    howItWorks: 'Hoe het werkt',
    pricing: 'Tarieven',
    brief: 'Start een briefing',
  },

  hero: {
    /** Kicker only — `route` must stay byte-identical to `scenarios.ts`. City
     *  names do not change in Dutch, so the kickers below are unchanged. */
    headlines: [
      { route: 'Amsterdam → New York JFK', kicker: 'Amsterdam · New York' },
      { route: 'Amsterdam → Innsbruck', kicker: 'Amsterdam · Innsbruck' },
      { route: 'Amsterdam → Singapore', kicker: 'Amsterdam · Singapore' },
      { route: 'Amsterdam → Turin', kicker: 'Amsterdam · Turin' },
    ],
    clause: 'tussen de goedkoopste en de duurste vertrekdatum',
    pitch:
      'Onze agents vergelijken duizend vluchten en leggen je de handvol voor die het vergelijken en beslissen waard zijn. Rapporten vanaf €3.',
    ctaBrief: 'Start een briefing',
    ctaHow: 'Bekijk hoe het werkt',
    /** The lit sign and the flap rows. Verified in the browser against the
     *  drums' ' A-Z0-9.-/' alphabet and the board's column widths — see the
     *  DEP_COLS comment in +page.svelte for the `save` column, widened for
     *  this line. */
    boardSign: 'Goedkoopste dag per route',
    boardFare: (fare: number) => `EUR ${fare}`,
    boardSave: (spread: number) => `BESPAAR ${spread}`,
  },

  weekband: {
    heading: (best: number) => `Zeven vertrekdata, tot €${best} tussen de beste en de duurste`,
    body: (best: number, worst: number) =>
      `Negen echte routes, elk geprijsd op alle zeven vertrekdata in het venster. Data verschuiven was €${best} waard op New York en €${worst} op Lyon, en niets aan beide routes verried dat vooraf. Het antwoord voor New York kostte €10.`,
    ctaBrief: 'Start een briefing, vanaf €3',
    ctaHow: 'Bekijk hoe het werkt',
    proof: (queries: number, options: string, carriers: number, seconds: number) =>
      `${queries} zoekopdrachten · ${options} opties · ${carriers} maatschappijen · ${seconds} seconden`,
    boardWindow: 'elke vertrekdatum',
    boardFootLead: 'Goedkoopste dag',
    boardFootDearest: ', duurste',
    boardFootWorth: 'en flexibel zijn was',
    boardFootTail: 'waard op deze route. Enkele reis, economy.',
  },

  evidence: {
    heading: (best: number, worst: number) =>
      `De juiste vertrekdatum was €${best} waard op New York en €${worst} op Lyon`,
    lead: (paidForItself: number, routes: number, timesOver: number) =>
      `Elke route hier is doorzocht op alle zeven vertrekdata, dus de spreiding is precies wat het verschuiven van je data je had bespaard. ${paidForItself} van de ${routes} leverden meer op dan de €10 die we voor het uitzoeken rekenen, en de beste daarvan leverde ${timesOver} keer dat bedrag op. Je weet pas welk type route je hebt zodra iemand het heeft nagezocht.`,
    kicker: (
      economyLow: number,
      economyHigh: number,
      premiumFlat: number,
      overDearest: number,
      overCheapest: number,
    ) =>
      `De klasse maakt zijn eigen punt. In die Singapore-week bewoog economy tussen €${economyLow} en €${economyHigh}, terwijl premium economy elke dag op €${premiumFlat} bleef staan. De upgrade kostte €${overDearest} op de duurste economydag en €${overCheapest} op de goedkoopste. De upgrade zelf bewoog nooit; alleen waarmee je hem vergeleek veranderde. Veertien zoekopdrachten en 37 seconden leverden dat antwoord op.`,
    keyPay: 'Goedkoopste dag van de week',
    keyAdd: 'Wat de duurste dag toevoegt',
    colRoute: 'Route',
    colChart: 'Enkele reis-tarief door de week',
    colCheapest: 'Goedkoopst',
    colDearest: 'Duurst',
    colSave: 'Je bespaart',
    fareNote:
      'Elke route is doorzocht op alle zeven vertrekdata, en de balken delen één schaal, dus de Alpenroutes zijn echt zoveel goedkoper dan de Atlantische. Het percentage is de besparing gemeten tegen het goedkoopste tarief, en daarom wint Innsbruck op flexibiliteit van New York, terwijl het een tiende kost. Acht van de negen spreidingen verslaan de €10 die een Verkenning kost. Enkele reis-tarieven in economy, de goedkoopste op het moment dat we keken.',
  },

  work: {
    heading:
      'Vijfenzeventig zoekopdrachten kostten ons 200 seconden. Met de hand kost dat twee uur.',
    lead: 'Vier briefings, vijfenzeventig zoekopdrachten. Eén zoekopdracht is één route geprijsd op één datum, dus een briefing die beide open laat is niet één vraag maar tientallen, en bij tientallen houdt een rij browsertabs op nuttig te zijn.',
    scenarios: {
      gateway: {
        ask: 'Hanoi in november. Ik reis desnoods met de trein naar Brussel of Frankfurt als dat goedkoper is, maakt me niet uit.',
        rowKind: 'vertrekluchthavens',
      },
      ski: {
        ask: 'Ergens met sneeuw, derde week van januari? Maakt niet uit waar, zolang het geen fortuin kost om er te komen.',
        rowKind: 'bestemmingen',
      },
      cabin: {
        ask: 'Singapore in november. Is premium economy die week echt de moeite waard, of betaal ik €500 voor een grotere stoel?',
        rowKind: 'klassen',
      },
      holidays: {
        ask: 'New York met kerst. Of Boston, of Philadelphia als dat goedkoper is, overal waar ik met de trein heen kan.',
        rowKind: 'bestemmingen',
      },
    },
    countUnit: 'zoekopdrachten',
    shape: (rows: number, rowKind: string, cols: number) =>
      `${rows} ${rowKind} × ${cols} ${cols === 1 ? 'datum' : 'data'}`,
    jobTally: (options: string, seconds: number) => `${options} opties · ${seconds} seconden`,
    totalLead: (queries: number) => `${queries} zoekopdrachten`,
    totalBody: (
      seconds: number,
      options: string,
      carriers: number,
      manualSeconds: number,
      queries: number,
      hours: string,
    ) =>
      `in ${seconds} seconden daadwerkelijk zoeken, wat ${options} opties opleverde bij ${carriers} maatschappijen. Met de hand, aan een royale ${manualSeconds} seconden per stuk (route intypen, wachten, resultaten scannen, prijs noteren), kosten diezelfde ${queries} zoekopdrachten ongeveer ${hours} uur. De grootste van de vier, achtentwintig zoekopdrachten over vier Amerikaanse steden, is een Verkenning van €10. Die met-de-hand-schatting is het enige cijfer op deze pagina dat we niet hebben gemeten.`,
  },

  /** De vijf verhalen uit `STORIES`, elk in de band waar het bewijs voor is.
   *  `point` krijgt beide tarieven en het verschil ertussen als parameters, dus
   *  de zin eromheen mag hier anders lopen dan in het Engels, maar de cijfers
   *  liggen vast. De regel met de telling eronder komt uit `work`. */
  stories: {
    lisbon: {
      ask: 'Lissabon in oktober. Mijn zus woont daar, dus de datum is wat die week het goedkoopst is. Maakt me echt niet uit welke dag.',
      rowKind: 'route',
      point: (low: number, high: number, gap: number) =>
        `€${low} op de goedkoopste dag van die week, €${high} op de duurste. Dat is €${gap} voor het opschuiven van een vlucht van drie uur met een paar dagen. De goedkope was er ook nog een directe.`,
    },
    bali: {
      ask: "Bali in februari. Eén tussenstop is prima, maar niet Doha. Dat heb ik één keer gedaan en toen zat ik daar vijf uur op een bankje, om drie uur 's nachts.",
      rowKind: 'route',
      point: (low: number, high: number, gap: number) =>
        `De goedkoopste was €${low}, met een overstap in de Golf. Sluit de Golf uit en de goedkoopste is €${high}. Van dat bankje wegblijven kost dus €${gap}. Er vliegt niemand direct, dus het werd altijd iemands luchthaven midden in de nacht.`,
    },
    chiangmai: {
      ask: 'Chiang Mai in november. Er vliegt niemand direct heen, dus ik heb geen idee wat een normale prijs is.',
      rowKind: 'route',
      point: (low: number, high: number, gap: number) =>
        `€${low} was de goedkoopste, met twee tussenstops. €${high} was de snelste, met één, en die landde uren eerder. €${gap} verschil, en als je de route één keer zoekt, zie je geen van beide.`,
    },
    warm: {
      ask: 'Ergens warm voor een lang weekend in februari. Canarische Eilanden, Portugal, Marokko, maakt me niet uit. Ik wil gewoon buiten kunnen zitten.',
      rowKind: 'bestemmingen',
      point: (low: number, high: number, gap: number) =>
        `Vier bestemmingen, elk op drie data. €${low} naar de goedkoopste en €${high} naar de duurste. €${gap} tussen twee plekken die in de briefing allebei gewoon "ergens warm" waren.`,
    },
    istanbul: {
      ask: 'Istanbul, eerste week van december. Goedkoop is mooi, maar ik ga er geen hele dag over doen. Ik heb maar vier dagen.',
      rowKind: 'route',
      point: (low: number, high: number, gap: number) =>
        `€${low} was de goedkoopste en die stapt over. €${high} was de snelste en die niet. €${gap} koopt de middag terug, en beide staan in het rapport met hun reistijd ernaast.`,
    },
  },

  avoid: {
    heading: 'De Golf uitsluiten: €73 op Singapore, €0 op Hanoi',
    lead: 'Stel dat je niet wilt overstappen in de Golf. We lezen eerst alle opties en halen daarna de opties weg die daar overstappen. Wat dat kost verschilt per route, en allebei prijzen is de enige manier om het te weten.',
    toggleOn: 'Golf-hubs uitgesloten',
    toggleOff: 'Alles wat we vonden',
    toggleHint:
      'Laat elke optie vallen die overstapt in Dubai, Doha, Abu Dhabi, Bahrein, Muscat of Koeweit.',
    optionCount: (options: string) => `${options} opties`,
    viaGulf: (options: string) => `${options} via de Golf`,
    cheapest: 'Goedkoopst',
    up: (added: number) => `€${added} duurder`,
    without: (fare: number) => `€${fare} zonder die hubs`,
    unchanged: 'in beide gevallen gelijk',
    hubsHeading: 'Waar de overstappen plaatsvinden',
    hubsNote: (options: string, airports: number) =>
      `Overstaptellingen over alle ${options} opties, in ${airports} verschillende luchthavens. Een hub uitsluiten kijkt alleen naar overstapluchthavens, nooit naar je vertrek- of bestemmingsluchthaven.`,
  },

  routes: {
    heading: (routings: string, seconds: string) =>
      `Er zijn ${routings} manieren om Hanoi te bereiken, en we lazen de kaart in ${seconds} seconden voor we er één gingen prijzen`,
    lead: 'Elke lijn is één manier om van Amsterdam naar Hanoi te komen binnen een tussenstopbudget. We kijken eerst wat met wat verbonden is, en gaan dan de routes prijzen die het waard zijn.',
    webLabel: (routings: string, stops: number) =>
      `${routings} routeringen binnen ${stops} ${stops === 1 ? 'tussenstop' : 'tussenstops'}`,
    webUpTo: (stops: number) => `Tot ${stops} ${stops === 1 ? 'tussenstop' : 'tussenstops'}`,
    webNote: (airports: string, connections: string, seconds: string) =>
      `Amsterdam naar Hanoi, doorlopen over een kaart van ${airports} luchthavens en ${connections} directe verbindingen in ${seconds} seconden.`,
    tabsLabel: 'Kies een tussenstopbudget',
  },

  report: {
    heading: 'Hoe het werkt',
    steps: [
      {
        h: 'Stuur een ruwe briefing',
        p: 'Vanwaar, waarheen en ongeveer wanneer. Meerdere bestemmingen kan, en vaag ook. Vaag is precies het deel waar we goed in zijn.',
      },
      {
        h: 'Wij prijzen elke datum',
        p: 'Eén zoekopdracht tegelijk, met een paar seconden ertussen, want een vluchtensite die te veel verzoeken tegelijk krijgt, stopt met antwoorden. Het duurt minuten, en je hoeft er niet bij te blijven zitten.',
      },
      {
        h: 'Het rapport komt binnen',
        p: 'Een PDF met de prijzen dag voor dag, elke optie gerangschikt op prijs en reistijd, en per optie een boekingslink. De laatste van deze runs vond €147 verschil tussen de beste en de slechtste vertrekdatum. Je boekt op dezelfde plek als altijd.',
      },
    ],
    showcase: {
      pagesLabel: "Rapportpagina's",
      cover: 'Omslag',
      coverCaption:
        'Elke route op één kaart, en een simpele samenvatting van wat de cijfers zeiden.',
      chart: 'Prijs per datum',
      chartCaption:
        'Per route: de laagste prijs van die dag tegenover het daggemiddelde, zodat je ziet of een goedkope dag één gelukstoeval is of de hele dag.',
      table: 'Opties',
      tableCaption:
        'Tien opties per datum, elk met maatschappij, routering, totale reistijd, aankomstdag en een boekingslink.',
      pageAlt: (label: string) => `Rapportpagina: ${label}`,
    },
  },

  pricing: {
    heading: 'Je betaalt voor het zoeken, niet voor de stoel',
    lead: 'Meer data en bestemmingen betekent meer zoekwerk, en dat zoekwerk is wat je betaalt. Het New York-rapport hierboven kostte €10 en vond €147 tussen de beste en de slechtste dag in zijn venster.',
    kicker:
      'Eén route op één vaste datum? Google Flights doet dat gratis in negentig seconden, dus betaal ons daar niet voor. We zijn het waard zodra je meerdere bestemmingen en flexibele data hebt, waar de spreiding meestal meer waard is dan de kosten.',
    tiers: {
      enquiry: {
        name: 'Aanvraag',
        scope: 'Eén route, één datum.',
        time: 'onder een minuut',
      },
      flexible: {
        name: 'Flexibel',
        scope: 'Eén route, tot 9 vertrekdata.',
        time: '1–2 minuten',
      },
      survey: {
        name: 'Verkenning',
        scope: 'Tot 5 bestemmingen binnen een datumvenster, economy en premium.',
        time: '3–5 minuten',
      },
    },
    tariffLegend: 'Wat een rapport kost',
    searchMark: searchMark,
    searchUnit: searchUnit,
    searchCount: (n: number) => `${searchMark(n)}${n} ${searchUnit(n)}`,
    tiersFoot:
      'Elk tarief is hetzelfde werk in een ander formaat. Heen-en-terug-datumgrids zijn beperkt tot 21 datumcombinaties.',
  },

  brief: {
    heading: 'Stuur een briefing',
    lead: 'Alleen de bestemming is verplicht. Al het andere is een tik, of laat het leeg en wij gebruiken ons eigen oordeel. De vaagste briefings zijn juist het meest waard, omdat ze de meeste data hebben om fout over te zitten. Het rapport komt dezelfde dag terug.',
    limits: [
      'We boeken of ticketen niets. We vinden de opties en geven je de links.',
      'Prijzen komen uit publieke vluchtzoekresultaten, niet van de maatschappijen zelf, dus het zijn de prijzen die zichtbaar waren toen we keken en ze kunnen bewegen voordat je boekt.',
      'Alleen de weergegeven prijs, zonder bagageregels, tariefvoorwaarden of belastingspecificatie.',
      'De motor is een publiek command-line-programma genaamd flt. Het staat op GitHub, en je mag het gerust zelf draaien en ons volledig overslaan.',
    ],
    origins: ['Amsterdam', 'Brussel', 'Parijs', 'Düsseldorf', 'Frankfurt', 'Ergens anders'],
    lengths: ['Een lang weekend', 'Een week', 'Twee weken', 'Langer', 'Enkele reis'],
    dates: ['Exacte data', 'Een paar dagen speling', 'Willekeurige week die maand'],
    cabins: ['Economy', 'Premium economy', 'Business'],
    priorities: [
      'Prijs',
      'Minste tussenstops',
      'Kortste reistijd',
      'Vluchten overdag',
      'Bagage inbegrepen',
      'Een maatschappij die ik ken',
    ],
    dislikes: [
      'Nachtvluchten',
      'Tussenstops langer dan vier uur',
      'Prijsvechters',
      "Vertrek voor 8 uur 's ochtends",
      'Van luchthaven wisselen in een stad',
    ],
    dealbreakers: [
      'Meer dan één tussenstop',
      'Golf-hubs',
      'Overnachtingen onderweg',
      'Landen na middernacht',
      'Losse tickets',
    ],
    toLabel: 'Waar wil je heen?',
    toPlaceholder: 'Vietnam. Of Hanoi. Of ergens warms in november.',
    fromLabel: 'Vanwaar',
    elsewhereLabel: 'Welke luchthaven',
    elsewherePlaceholder: 'Berlijn',
    monthLabel: 'Welke maand',
    lengthLabel: 'Hoe lang',
    moreSummary: 'Ergens kieskeurig over?',
    moreHint: (dates: string, cabin: string) => `Optioneel: ${dates}, ${cabin}, verder geen regels`,
    datesLabel: 'Jouw data',
    cabinLabel: 'Klasse',
    prioritiesLabel: 'Wat het belangrijkst is, in de volgorde waarin je tikt',
    dislikesLabel: 'Liever niet',
    dealbreakersLabel: 'Dealbreakers',
    notesLabel: 'Nog iets anders',
    notesPlaceholder: 'Optioneel. We lezen elk woord.',
    emailLabel: 'Waar het rapport heen gaat',
    emailPlaceholder: 'jij@voorbeeld.nl',
    total: (name: string, searches: string) => `${name} · ${searches}`,
    payBusy: 'Checkout wordt geopend…',
    pay: (price: string) => `Betaal ${price}`,
    note: (time: string) =>
      `Je rondt af op Stripe's checkout: kaart, Apple Pay of Google Pay, en een kortingscode als je die hebt. Wij zien je kaartgegevens nooit. Het rapport landt over ongeveer ${time} in je inbox.`,
    checkoutLineItem: (name: string) => `Bureau: ${name}-rapport`,
  },

  status: {
    title: 'Bureau: jouw rapport',
    brand: 'Bureau',
    missing: 'We kunnen die klus niet vinden. Controleer de link in je bevestiging.',
    eyebrow: (tier: string, job: string) => `${tier} · klus ${job}`,
    count: (done: number, total: number) =>
      `${done} van ${total} zoekopdrachten · de zoekopdrachten worden bewust gespreid, dus dit duurt enkele minuten`,
    open: 'Open je rapport',
    looking: 'Je klus wordt opgezocht…',
  },

  footer: {
    line: 'Bureau: vluchtonderzoeksrapporten. Wij vinden de vluchten; jij boekt ze.',
  },

  errors: {
    badTier: 'Dat is geen van de drie tarieven.',
    noEmail: 'We hebben een e-mailadres nodig om het rapport naartoe te sturen.',
    noDestination: 'Vertel ons waar je heen wilt.',
    noCheckoutUrl: 'Stripe gaf geen checkoutpagina terug.',
    checkoutUnreachable: 'We konden de checkout niet bereiken. Probeer het zo weer.',
  },
}
