import {
  addLearning,
  learningScore,
  loadLearnings,
  topLearnings,
  voteLearning,
} from '@flights/cli/learnings'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ToolError, guard } from '../shared'

export function registerLearnings(server: McpServer): void {
  server.registerTool(
    'learn',
    {
      title: 'Record a learning',
      description:
        'Record a flight-search learning for future agents (e.g. "Tue/Wed departures ~15% cheaper ' +
        'on longhaul"). Stored globally at ~/.config/flt/learnings.json, shared with the flt CLI. Idempotent.',
      inputSchema: {
        text: z.string().min(1).describe('The learning'),
      },
    },
    guard(async (a) => {
      const { learning, created } = await addLearning(a.text)
      return {
        ok: true,
        id: learning.id,
        created,
        score: learningScore(learning),
        text: learning.text,
      }
    }),
  )

  server.registerTool(
    'vote',
    {
      title: 'Vote on a learning',
      description: 'Vote a learning up or down by ID (see the learnings tool).',
      inputSchema: {
        id: z.string().describe('Learning ID (e.g. La1b2c3)'),
        dir: z.enum(['up', 'down']).describe('Vote direction'),
      },
    },
    guard(async (a) => {
      const learning = await voteLearning(a.id, a.dir)
      if (!learning) {
        throw new ToolError('NOT_FOUND', `No learning '${a.id}'. Use the learnings tool to list IDs.`)
      }
      return {
        ok: true,
        id: learning.id,
        score: learningScore(learning),
        up: learning.up,
        down: learning.down,
      }
    }),
  )

  server.registerTool(
    'learnings',
    {
      title: 'List learnings',
      description: 'List top flight-search learnings by vote score, shared with the flt CLI.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(10).describe('Max learnings'),
      },
    },
    guard(async (a) => {
      const all = await loadLearnings()
      if (!all.length) {
        return { learnings: [], hint: 'No learnings yet. Add one with the learn tool.' }
      }
      return {
        total: all.length,
        learnings: topLearnings(all, a.limit).map((l) => ({
          id: l.id,
          score: learningScore(l),
          up: l.up,
          down: l.down,
          text: l.text,
        })),
      }
    }),
  )
}
