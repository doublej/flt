import type { Terminal } from './terminal'

interface DemoStep {
  narrate: string
  command: string
  pause?: number   // ms to wait after command completes (default 2500)
  scrolls?: number // MD scrolls after command
}

const STEPS: DemoStep[] = [
  {
    narrate: 'SHOW HELP — ALL AVAILABLE COMMANDS',
    command: 'H/',
    pause: 3000,
    scrolls: 2,
  },
  {
    narrate: 'SEARCH AIRPORTS BY CITY NAME',
    command: 'AN TOKYO',
    pause: 2500,
  },
  {
    narrate: 'LOOKUP AIRPORT BY IATA CODE',
    command: 'AN NRT',
    pause: 2000,
  },
  {
    narrate: 'START A NAMED SESSION',
    command: 'SS/START DEMO',
    pause: 2000,
  },
  {
    narrate: 'SEARCH AMS → NRT ON 10 MAR',
    command: '1AMSNRT10MAR',
    pause: 3500,
    scrolls: 1,
  },
  {
    narrate: 'INSPECT OFFER #1',
    command: '*1',
    pause: 3000,
  },
  {
    narrate: 'SORT RESULTS BY PRICE',
    command: 'SP',
    pause: 2000,
  },
  {
    narrate: 'FILTER — DIRECT FLIGHTS ONLY',
    command: 'QD',
    pause: 2500,
  },
  {
    narrate: 'CLEAR ALL FILTERS',
    command: 'QC',
    pause: 2000,
  },
  {
    narrate: 'SEARCH HELP — OPTION SYNTAX',
    command: 'H/SEARCH',
    pause: 2500,
  },
  {
    narrate: 'FILTER/SORT HELP',
    command: 'H/FILTER',
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
export async function runDemo(term: Terminal): Promise<void> {
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

  term.setStatus('DEMO COMPLETE — TERMINAL IS YOURS')
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
