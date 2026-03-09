import { M } from '../terminal'

const HELP_DISPLAY = [
  `  ${M.G}DISPLAY${M.g}`,
  `  *N                        SHOW DETAIL FOR OFFER N`,
  `  *Fa3b7                    SHOW DETAIL BY FLIGHT ID`,
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
  `  H/FAVORITES               FAVORITES COMMANDS`,
  `  H/CONNECTIONS             CONNECTION ROUTE FINDER`,
  `  H/COMPARE                 MULTI-ROUTE COMPARISON`,
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
  `  /EHDOH                    EXCLUDE HUB AIRPORT`,
  `  /ERGULF                   EXCLUDE REGION (GULF/MIDDLEEAST/RUSSIA)`,
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
  `  SS/REOPEN [ID]            REOPEN LAST CLOSED SESSION`,
  `  SS/LIST                   LIST ALL SESSIONS`,
  `  SS/REFS                   LIST SEARCH REFS IN SESSION`,
  `  SS/RENAME NAME            RENAME ACTIVE SESSION`,
  `  SS/NUKE                   DELETE ALL CACHE + SESSIONS`,
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
  `  IT Fa3b7 Fc1d2             FROM CURRENT SEARCH`,
  `  IT REF:Fa3b7 REF:Fc1d2    FROM CROSS-SEARCH REFS`,
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

const HELP_FAVORITES = [
  `  ${M.G}FAVORITES${M.g}`,
  `  FV 3                      STAR OFFER #3`,
  `  FV Fa3b7                  STAR BY FLIGHT ID`,
  `  UV 3                      UNSTAR OFFER #3`,
  `  UV Fa3b7                  UNSTAR BY FLIGHT ID`,
  `  FV/                       LIST ALL FAVORITES`,
  '',
]

const HELP_CONNECTIONS = [
  `  ${M.G}CONNECTIONS${M.g}`,
  `  CN AMS MNL                FIND CONNECTION ROUTES`,
  `  CN AMS MNL /V IST         VIA WAYPOINT`,
  `  CN AMS MNL /E DOH         EXCLUDE AIRPORT`,
  `  CN AMS MNL /ER GULF       EXCLUDE REGION`,
  '',
]

const HELP_COMPARE = [
  `  ${M.G}COMPARE${M.g}`,
  `  CM AMS,BKK NRT 10MAR      COMPARE ROUTES ON DATE`,
  `  CM AMS NRT,HND 10MAR      MULTIPLE DESTINATIONS`,
  `  CM AMS,BKK NRT 10MAR/C    WITH CABIN CLASS`,
  `  CM AMS,BKK NRT 10MAR/$USD WITH CURRENCY`,
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
  FAVORITES: HELP_FAVORITES,
  CONNECTIONS: HELP_CONNECTIONS,
  COMPARE: HELP_COMPARE,
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
    ...HELP_FAVORITES,
    ...HELP_CONNECTIONS,
    ...HELP_COMPARE,
  ]
}
