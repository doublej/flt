import { defineCommand } from 'citty'
import {
  closeActiveSession,
  createEmptySession,
  getActiveSession,
  isSessionNameTaken,
  loadSession,
  reopenSession,
  saveSession,
  startSession,
} from '../state'

export const sessionCommand = defineCommand({
  meta: { name: 'session', description: 'Manage search sessions' },
  subCommands: {
    start: defineCommand({
      meta: { name: 'start', description: 'Start a new named search session' },
      args: {
        name: { type: 'positional', description: 'Session name', required: false },
      },
      async run({ args }) {
        const state = (await loadSession()) ?? createEmptySession()
        const active = getActiveSession(state)
        if (active) {
          closeActiveSession(state)
          console.error(
            `[session] Closed previous session "${active.name}" (${active.id}, ${active.searchRefs.length} searches).`,
          )
        }
        const s = startSession(state, args.name || undefined)
        await saveSession(state)
        console.log(JSON.stringify({ ok: true, id: s.id, name: s.name, startedAt: s.startedAt }))
      },
    }),
    close: defineCommand({
      meta: { name: 'close', description: 'Close the active session' },
      async run() {
        const state = (await loadSession()) ?? createEmptySession()
        const closed = closeActiveSession(state)
        if (!closed) {
          console.log(JSON.stringify({ err: 'NO_SESSION', hint: 'No active session to close.' }))
          return
        }
        await saveSession(state)
        console.log(
          JSON.stringify({
            ok: true,
            id: closed.id,
            name: closed.name,
            searches: closed.searchRefs.length,
          }),
        )
      },
    }),
    list: defineCommand({
      meta: { name: 'list', description: 'List all sessions' },
      async run() {
        const state = await loadSession()
        if (!state || state.sessions.length === 0) {
          console.log(JSON.stringify({ sessions: [] }))
          return
        }
        const sessions = state.sessions.map((s) => ({
          id: s.id,
          name: s.name,
          active: s.id === state.activeSessionId,
          startedAt: new Date(s.startedAt).toISOString(),
          closedAt: s.closedAt ? new Date(s.closedAt).toISOString() : null,
          searches: s.searchRefs.length,
        }))
        console.log(JSON.stringify({ sessions }))
      },
    }),
    reopen: defineCommand({
      meta: { name: 'reopen', description: 'Re-open a closed session (default: most recent)' },
      args: {
        id: { type: 'positional', description: 'Session ID to reopen', required: false },
      },
      async run({ args }) {
        const state = (await loadSession()) ?? createEmptySession()
        if (getActiveSession(state)) {
          console.log(
            JSON.stringify({ err: 'ACTIVE_SESSION', hint: 'Close the active session first.' }),
          )
          return
        }
        const reopened = reopenSession(state, args.id || undefined)
        if (!reopened) {
          console.log(
            JSON.stringify({ err: 'NOT_FOUND', hint: 'No closed session found to reopen.' }),
          )
          return
        }
        await saveSession(state)
        console.log(
          JSON.stringify({
            ok: true,
            id: reopened.id,
            name: reopened.name,
            searches: reopened.searchRefs.length,
          }),
        )
      },
    }),
    rename: defineCommand({
      meta: { name: 'rename', description: 'Rename a session' },
      args: {
        name: { type: 'positional', description: 'New name', required: true },
        id: { type: 'string', description: 'Session ID (default: active session)' },
      },
      async run({ args }) {
        const state = (await loadSession()) ?? createEmptySession()
        const target = args.id
          ? state.sessions.find((s) => s.id === args.id)
          : getActiveSession(state)
        if (!target) {
          console.log(
            JSON.stringify({ err: 'NOT_FOUND', hint: 'No matching session found.' }),
          )
          return
        }
        if (isSessionNameTaken(state, args.name, target.id)) {
          console.log(
            JSON.stringify({ err: 'DUPLICATE_NAME', hint: `A session named "${args.name}" already exists.` }),
          )
          return
        }
        target.name = args.name
        await saveSession(state)
        console.log(JSON.stringify({ ok: true, id: target.id, name: target.name }))
      },
    }),
  },
})
