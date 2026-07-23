import {
  closeActiveSession,
  createEmptySession,
  getActiveSession,
  getSessionById,
  isSessionNameTaken,
  loadSession,
  reopenSession,
  saveSession,
  startSession,
} from '@flights/core'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ToolError, guard } from '../shared'

export function registerSession(server: McpServer): void {
  server.registerTool(
    'session',
    {
      title: 'Manage search sessions',
      description:
        'Manage the shared flt search-session state (also used by the CLI). Actions: start a ' +
        'named session, close the active one, list all, reopen a closed one, list a session\'s ' +
        'search refs, or rename. Searches auto-start a session when none is active.',
      inputSchema: {
        action: z
          .enum(['start', 'close', 'list', 'reopen', 'refs', 'rename'])
          .describe('What to do'),
        name: z.string().optional().describe('Session name (start, rename)'),
        id: z.string().optional().describe('Session ID (reopen, refs, rename; default: active)'),
      },
    },
    guard(async (a) => {
      switch (a.action) {
        case 'start': {
          const state = (await loadSession()) ?? createEmptySession()
          const active = getActiveSession(state)
          const closed = active ? closeActiveSession(state) : null
          const s = startSession(state, a.name || undefined)
          await saveSession(state)
          return {
            ok: true,
            id: s.id,
            name: s.name,
            startedAt: s.startedAt,
            ...(closed ? { closedPrevious: { id: closed.id, name: closed.name } } : {}),
          }
        }
        case 'close': {
          const state = (await loadSession()) ?? createEmptySession()
          const closed = closeActiveSession(state)
          if (!closed) throw new ToolError('NO_SESSION', 'No active session to close.')
          await saveSession(state)
          return { ok: true, id: closed.id, name: closed.name, searches: closed.searchRefs.length }
        }
        case 'list': {
          const state = await loadSession()
          if (!state || state.sessions.length === 0) return { sessions: [] }
          return {
            sessions: state.sessions.map((s) => ({
              id: s.id,
              name: s.name,
              active: s.id === state.activeSessionId,
              startedAt: new Date(s.startedAt).toISOString(),
              closedAt: s.closedAt ? new Date(s.closedAt).toISOString() : null,
              searches: s.searchRefs.length,
            })),
          }
        }
        case 'reopen': {
          const state = (await loadSession()) ?? createEmptySession()
          if (getActiveSession(state)) {
            throw new ToolError('ACTIVE_SESSION', 'Close the active session first.')
          }
          const reopened = reopenSession(state, a.id || undefined)
          if (!reopened) throw new ToolError('NOT_FOUND', 'No closed session found to reopen.')
          await saveSession(state)
          return {
            ok: true,
            id: reopened.id,
            name: reopened.name,
            searches: reopened.searchRefs.length,
          }
        }
        case 'refs': {
          const state = await loadSession()
          if (!state) throw new ToolError('NO_SESSION', 'No sessions found.')
          const target = a.id ? getSessionById(state, a.id) : getActiveSession(state)
          if (!target) throw new ToolError('NOT_FOUND', 'No matching session found.')
          return {
            session: target.id,
            name: target.name,
            refs: target.searchRefs.map((ref) => {
              const search = state.searches[ref]
              return { ref, query: search?.query ?? null, offers: search?.offerCount ?? 0 }
            }),
          }
        }
        case 'rename': {
          if (!a.name) throw new ToolError('BAD_INPUT', 'rename requires a name.')
          const state = (await loadSession()) ?? createEmptySession()
          const target = a.id
            ? state.sessions.find((s) => s.id === a.id)
            : getActiveSession(state)
          if (!target) throw new ToolError('NOT_FOUND', 'No matching session found.')
          if (isSessionNameTaken(state, a.name, target.id)) {
            throw new ToolError('DUPLICATE_NAME', `A session named "${a.name}" already exists.`)
          }
          target.name = a.name
          await saveSession(state)
          return { ok: true, id: target.id, name: target.name }
        }
      }
    }),
  )
}
