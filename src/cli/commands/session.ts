import { defineCommand } from 'citty'
import { createEmptySession, loadSession, saveSession, startNewSession } from '../state'

export const sessionCommand = defineCommand({
  meta: { name: 'session', description: 'Manage search sessions' },
  subCommands: {
    start: defineCommand({
      meta: { name: 'start', description: 'Start a new search session (scopes takeout)' },
      async run() {
        const session = (await loadSession()) ?? createEmptySession()
        startNewSession(session)
        await saveSession(session)
        console.log(JSON.stringify({ ok: true, sessionStartedAt: session.sessionStartedAt }))
      },
    }),
  },
})
