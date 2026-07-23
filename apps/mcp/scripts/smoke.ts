/**
 * Smoke test: spawn the server over stdio, list tools, call offline tools.
 * Pass --live to also run one live Google Flights search.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js'

const live = process.argv.includes('--live')

const client = new Client({ name: 'smoke', version: '0.0.0' })
await client.connect(
  new StdioClientTransport({
    command: 'bun',
    args: ['run', 'src/index.ts'],
    // Session/cache state lives in $TMPDIR/flt (see core/state.ts). The SDK
    // strips env by default; forward TMPDIR so smoke shares state with the CLI.
    env: {
      ...getDefaultEnvironment(),
      ...(process.env.TMPDIR ? { TMPDIR: process.env.TMPDIR } : {}),
    },
  }),
)

const { tools } = await client.listTools()
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(', ')}`)

function text(res: Awaited<ReturnType<typeof client.callTool>>): string {
  const first = Array.isArray(res.content) ? res.content[0] : undefined
  return first?.type === 'text' ? first.text : JSON.stringify(res)
}

const airports = await client.callTool({
  name: 'airports',
  arguments: { query: 'amsterdam', limit: 3 },
})
console.log('airports(amsterdam):', text(airports).slice(0, 200))

const connections = await client.callTool({
  name: 'connections',
  arguments: { from: 'AMS', to: 'DLM', maxStops: 1, maxResults: 3 },
})
console.log('connections(AMS→DLM):', text(connections).slice(0, 300))

const learnings = await client.callTool({ name: 'learnings', arguments: { limit: 3 } })
console.log('learnings:', text(learnings).slice(0, 300))

const badDate = await client.callTool({
  name: 'search',
  arguments: { from: 'AMS', to: 'DLM', date: 'not-a-date' },
})
console.log('search(bad date) isError:', badDate.isError, text(badDate))

if (live) {
  const date = new Date(Date.now() + 45 * 86400_000).toISOString().slice(0, 10)
  const search = await client.callTool({
    name: 'search',
    arguments: { from: 'AMS', to: 'DLM', date, limit: 3 },
  })
  console.log(`search(AMS→DLM ${date}):`, text(search).slice(0, 600))
}

await client.close()
console.log('smoke: OK')
