import { M } from '../terminal'

const HELP_DISPLAY = [
  `  ${M.G}DISPLAY${M.g}`,
  `  *N                        SHOW DETAIL FOR OFFER N`,
  `  MD / MU                   SCROLL DOWN / UP`,
  `  MT / MB                   SCROLL TO TOP / BOTTOM`,
  '',
  `  ${M.G}AIRPORTS${M.g}`,
  `  AN TOKYO                  SEARCH AIRPORTS BY NAME`,
  `  AN NRT                    LOOKUP AIRPORT BY CODE`,
  '',
  `  ${M.G}SYSTEM${M.g}`,
  `  XI                        CLEAR DISPLAY`,
  `  H/                        QUICK REFERENCE (THIS SCREEN)`,
  `  H/SEARCH                  SEARCH SYNTAX + OPTIONS`,
  `  H/FILTER                  FILTER/SORT COMMANDS`,
  `  H/SESSION                 SESSION COMMANDS`,
  `  H/MATRIX                  MATRIX COMMANDS`,
  `  /SO                       SIGN OFF (EXIT)`,
  '',
  `${M.d}  CLASS: Y=ECONOMY  W=PREMIUM-ECO  C=BUSINESS  F=FIRST`,
  `  DATE FORMAT: DDMMM (10MAR, 25DEC)  USES CURRENT/NEXT YEAR${M.g}`,
  '',
]

const HELP_SEARCH = [
  `  ${M.G}AVAILABILITY${M.g}`,
  `  1AMSNRT10MAR              ONE-WAY  AMS TO NRT ON 10 MAR`,
  `  1AMSNRT10MAR*20MAR        ROUND TRIP  DEP 10MAR RET 20MAR`,
  `  1AMSNRT10MAR/C            BUSINESS CLASS  Y/W/C/F`,
  '',
  `  ${M.G}SEARCH OPTIONS${M.g}  ${M.d}(APPEND TO SEARCH)${M.g}`,
  `  /P2AD1CH                  PASSENGERS`,
  `  /X0                       MAX STOPS (0=DIRECT)`,
  `  /$USD                     CURRENCY`,
  `  /AKL                      AIRLINE FILTER (2-LETTER CODE)`,
  `  /DA0800  /DB1400          DEPART AFTER / BEFORE`,
  `  /AA1000  /AB2200          ARRIVE AFTER / BEFORE`,
  `  /DM600                    MAX DURATION (MINUTES)`,
  `  /SP /SD /SS /ST           SORT: PRICE/DUR/STOPS/DEP`,
  `  /L20                      LIMIT RESULTS`,
  `  /R                        FORCE REFRESH (SKIP CACHE)`,
  '',
]

const HELP_FILTER = [
  `  ${M.G}FILTER${M.g}  ${M.d}(AFTER SEARCH)${M.g}`,
  `  QD                        DIRECT ONLY`,
  `  QX1                       MAX 1 STOP`,
  `  QAKL                      FILTER BY CARRIER`,
  `  QDA0800                   DEPART AFTER 08:00`,
  `  QDB1400                   DEPART BEFORE 14:00`,
  `  QAA1000                   ARRIVE AFTER 10:00`,
  `  QAB2200                   ARRIVE BEFORE 22:00`,
  `  QM600                     MAX DURATION 600 MIN`,
  `  QC                        CLEAR ALL FILTERS`,
  '',
  `  ${M.G}SORT${M.g}`,
  `  SP                        SORT BY PRICE`,
  `  SD                        SORT BY DURATION`,
  `  SX                        SORT BY STOPS`,
  `  ST                        SORT BY DEPARTURE`,
  '',
]

const HELP_SESSION = [
  `  ${M.G}SESSION${M.g}`,
  `  SS/                       SHOW SESSION STATUS`,
  `  SS/START [NAME]           START NEW SESSION`,
  `  SS/CLOSE                  CLOSE ACTIVE SESSION`,
  `  SS/LIST                   LIST ALL SESSIONS`,
  `  SS/RENAME NAME            RENAME ACTIVE SESSION`,
  '',
]

const HELP_MATRIX = [
  `  ${M.G}MATRIX${M.g}`,
  `  DMAMSNRT10MAR-14MAR       ONE-WAY DATE RANGE`,
  `  DMAMSNRT10MAR-14MAR*17MAR-21MAR  ROUND-TRIP`,
  `  DMAMSNRT10MAR-14MAR/C/$USD       WITH OPTIONS`,
  '',
]

const HELP_ITINERARY = [
  `  ${M.G}ITINERARY${M.g}`,
  `  IT O1 O3                  FROM CURRENT SEARCH`,
  `  IT REF1:O1 REF2:O2        FROM CROSS-SEARCH REFS`,
  '',
]

const HELP_TAKEOUT = [
  `  ${M.G}TAKEOUT${M.g}`,
  `  TO                        EXPORT TO DESKTOP`,
  `  TO/TITLE MY TRIP          EXPORT WITH CUSTOM TITLE`,
  '',
]

const HELP_CONFIG = [
  `  ${M.G}CONFIG${M.g}`,
  `  CF/                       SHOW ALL CONFIG`,
  `  CF/CURRENCY               SHOW ONE KEY`,
  `  CF/CURRENCY=USD           SET KEY`,
  `  CF/CURRENCY=              UNSET KEY`,
  '',
]

const HELP_SECTIONS: Record<string, string[]> = {
  SEARCH: HELP_SEARCH,
  FILTER: HELP_FILTER,
  SESSION: HELP_SESSION,
  MATRIX: HELP_MATRIX,
  ITINERARY: HELP_ITINERARY,
  TAKEOUT: HELP_TAKEOUT,
  CONFIG: HELP_CONFIG,
}

export function help(section?: string): string[] {
  if (section && HELP_SECTIONS[section]) {
    return ['', `${M.G} ** ${section} HELP **${M.g}`, '', ...HELP_SECTIONS[section]]
  }
  // Quick reference — navigation first, then features
  return [
    '',
    `${M.G} ** FLIGHTS/RES COMMAND REFERENCE **${M.g}`,
    '',
    ...HELP_DISPLAY,
    ...HELP_SEARCH,
    ...HELP_FILTER,
    ...HELP_SESSION,
    ...HELP_MATRIX,
    ...HELP_ITINERARY,
    ...HELP_TAKEOUT,
    ...HELP_CONFIG,
  ]
}
