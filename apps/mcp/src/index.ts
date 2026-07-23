/**
 * @flights/mcp — MCP server mirroring the flt CLI over stdio.
 * All domain logic comes from @flights/core; learnings and validation are
 * shared with @flights/cli. Cache, sessions, and learnings interoperate with
 * the CLI, so refs and offer IDs work across both surfaces.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerCompare } from './tools/compare'
import { registerLearnings } from './tools/learnings'
import { registerMatrix } from './tools/matrix'
import { registerInspect, registerItinerary } from './tools/offers'
import { registerAirports, registerConnections } from './tools/routes'
import { registerSearch } from './tools/search'
import { registerSession } from './tools/session'

const server = new McpServer({ name: 'flt', version: '0.1.0' })

registerSearch(server)
registerCompare(server)
registerMatrix(server)
registerAirports(server)
registerConnections(server)
registerInspect(server)
registerItinerary(server)
registerLearnings(server)
registerSession(server)

await server.connect(new StdioServerTransport())
console.error('flt MCP server ready (stdio)')
