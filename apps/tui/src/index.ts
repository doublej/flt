import { getActiveSession } from '@flights/core'
import { Terminal } from './terminal'
import { handleCommand, createState } from './commands'

if (!process.stdin.isTTY) {
  console.error('FLIGHTS/RES requires a terminal (TTY)')
  process.exit(1)
}

const state = await createState()
const term = new Terminal((cmd) => {
  handleCommand(cmd, term, state).catch((e: unknown) => {
    term.setStatus(`ERROR: ${e instanceof Error ? e.message : e}`)
  })
})

const active = getActiveSession(state.session)
if (active) term.setSessionName(active.name)

term.start()
await term.showSplash(true)
