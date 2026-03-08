import { defineCommand, runCommand, runMain, showUsage } from 'citty'
import { airportsCommand } from './commands/airports'
import { configCommand } from './commands/config'
import { inspectCommand } from './commands/inspect'
import { itineraryCommand } from './commands/itinerary'
import { matrixCommand } from './commands/matrix'
import { primeCommand } from './commands/prime'
import { searchCommand } from './commands/search'
import { takeoutCommand } from './commands/takeout'

const SUB_COMMANDS = {
  search: searchCommand,
  inspect: inspectCommand,
  itinerary: itineraryCommand,
  matrix: matrixCommand,
  airports: airportsCommand,
  prime: primeCommand,
  takeout: takeoutCommand,
  config: configCommand,
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const FLEX_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$|^(today|tomorrow|overmorrow)$/i

const main = defineCommand({
  meta: { name: 'flt', version: '0.1.0', description: 'Flight search CLI' },
  subCommands: SUB_COMMANDS,
})

// Smart routing: detect intent from raw args before citty parses them.
// `flt ams` → airports, `flt AMS NRT 2026-04-10` → search, `flt O1` → inspect
const args = process.argv.slice(2)
const first = args[0]

if (!first || first === '--help' || first === '-h') {
  await showUsage(main)
} else if (first in SUB_COMMANDS) {
  runMain(main)
} else if (first.match(/^O\d+$/i)) {
  runCommand(inspectCommand, { rawArgs: args })
} else if (args.length >= 3 && (DATE_RE.test(args[2]) || FLEX_DATE.test(args[2]))) {
  runCommand(searchCommand, { rawArgs: args })
} else {
  runCommand(airportsCommand, { rawArgs: [args[0], '--limit', '5'] })
}
