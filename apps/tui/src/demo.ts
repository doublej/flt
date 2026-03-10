import { nukeCache, createEmptySession } from '@flights/core'
import type { Terminal } from './terminal'
import type { AppState } from './commands/shared'

interface DemoStep {
  narrate: string
  command: string
  pause?: number   // ms to wait after command completes (default 2500)
  scrolls?: number // MD scrolls after command
}

const STEPS: DemoStep[] = [
  {
    narrate: 'QUICK HELP — COMMAND OVERVIEW',
    command: 'H/',
    pause: 3000,
    scrolls: 2,
  },
  {
    narrate: 'SEARCH AIRPORTS — FIND TOKYO',
    command: 'AN TOKYO',
    pause: 2500,
  },
  {
    narrate: 'START A TRIP SESSION',
    command: 'SS/START MY FLIGHT TO TOKYO',
    pause: 2000,
  },
  {
    narrate: 'FIND ROUTING OPTIONS AMS → NRT',
    command: 'CN AMS NRT',
    pause: 3000,
  },
  {
    narrate: 'SEARCH AMS → NRT ON 10 MAR',
    command: '1AMSNRT10MAR',
    pause: 3500,
    scrolls: 1,
  },
  {
    narrate: 'INSPECT TOP RESULT',
    command: '*1',
    pause: 3000,
  },
  {
    narrate: 'SORT BY PRICE',
    command: 'SP',
    pause: 2000,
  },
  {
    narrate: 'DIRECT FLIGHTS ONLY',
    command: 'QD',
    pause: 2500,
  },
  {
    narrate: 'STAR A FAVORITE',
    command: 'FV 1',
    pause: 2000,
  },
  {
    narrate: 'CLEAR FILTERS',
    command: 'QC',
    pause: 2000,
  },
  {
    narrate: 'DATE MATRIX — FIND CHEAPEST DATE',
    command: 'DMAMSNRT10MAR-14MAR',
    pause: 4000,
  },
  {
    narrate: 'COMPARE AIRPORTS — NRT VS HND',
    command: 'CM AMS NRT,HND 10MAR',
    pause: 4000,
  },
  {
    narrate: 'VIEW STARRED FAVORITES',
    command: 'FV/',
    pause: 2500,
  },
  {
    narrate: 'SHOW SESSION STATUS',
    command: 'SS/',
    pause: 2000,
  },
  {
    narrate: 'CLEAR DISPLAY',
    command: 'XI',
    pause: 1500,
  },
]

const TYPE_DELAY = 60   // ms between characters
const ENTER_DELAY = 300 // ms pause before pressing enter

/** Run the demo sequence — simulates typing commands */
export async function runDemo(term: Terminal, state: AppState): Promise<void> {
  await nukeCache()
  state.session = createEmptySession()
  state.flights = []
  state.rawFlights = []
  state.lastQuery = null
  state.lastRef = null
  term.setSessionName(null)
  await sleep(1500)

  for (const step of STEPS) {
    term.setStatus(`DEMO: ${step.narrate}`)
    await sleep(800)

    // Type the command character by character
    for (const ch of step.command) {
      term.injectKey(ch)
      await sleep(TYPE_DELAY)
    }

    await sleep(ENTER_DELAY)
    term.injectKey('ENTER')

    // Wait for command to process
    await sleep(step.pause ?? 2500)

    // Scroll if needed
    if (step.scrolls) {
      for (let i = 0; i < step.scrolls; i++) {
        term.injectKey('PAGE_DOWN')
        await sleep(1200)
      }
    }
  }

  term.setStatus('DEMO COMPLETE')
  await sleep(2000)
  await term.stop()
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
