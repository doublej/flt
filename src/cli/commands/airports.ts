import { searchAirports } from '$lib/server/flights/airports'
import { defineCommand } from 'citty'

export const airportsCommand = defineCommand({
  meta: { name: 'airports', description: 'Search airports by name, city, or IATA code' },
  args: {
    query: {
      type: 'positional',
      description: 'Search query (city, airport name, or IATA code)',
      required: true,
    },
    limit: { type: 'string', description: 'Max results', default: '20' },
  },
  async run({ args }) {
    const limit = Number.parseInt(args.limit)
    const results = searchAirports(args.query).slice(0, limit)
    if (results.length === 0) {
      console.log(
        JSON.stringify({ err: 'NO_MATCH', hint: `No airports matching '${args.query}'.` }),
      )
      return
    }
    for (const a of results) console.log(JSON.stringify(a))
  },
})
