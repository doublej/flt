import {
  closeActiveSession,
  getActiveSession,
  isSessionNameTaken,
  saveSession,
  startSession,
} from '@flights/core'
import type { Terminal } from '../terminal'
import { sessionStatus, sessionList } from '../format'
import type { AppState } from './shared'

export function updateHeaderSession(term: Terminal, state: AppState) {
  const active = getActiveSession(state.session)
  term.setSessionName(active?.name ?? null)
}

export async function handleSession(cmd: string, raw: string, term: Terminal, state: AppState) {
  const sub = cmd.slice(3).trim()

  if (!sub) {
    const active = getActiveSession(state.session)
    term.setContent(sessionStatus(active, state.session))
    term.setStatus(active ? `SESSION: ${active.name.toUpperCase()}` : 'NO ACTIVE SESSION')
    return
  }

  if (sub === 'LIST') {
    term.setContent(sessionList(state.session))
    term.setStatus(`${state.session.sessions.length} SESSION${state.session.sessions.length !== 1 ? 'S' : ''}`)
    return
  }

  if (sub.startsWith('START')) {
    const name = raw.slice(raw.toUpperCase().indexOf('START') + 5).trim() || undefined
    const active = getActiveSession(state.session)
    if (active) closeActiveSession(state.session)
    const s = startSession(state.session, name)
    await saveSession(state.session)
    updateHeaderSession(term, state)
    term.setStatus(`SESSION STARTED: ${s.name.toUpperCase()} (${s.id})`)
    return
  }

  if (sub === 'CLOSE') {
    const closed = closeActiveSession(state.session)
    if (!closed) { term.setStatus('NO ACTIVE SESSION'); return }
    await saveSession(state.session)
    updateHeaderSession(term, state)
    term.setStatus(`SESSION CLOSED: ${closed.name.toUpperCase()}`)
    return
  }

  if (sub.startsWith('RENAME')) {
    const name = raw.slice(raw.toUpperCase().indexOf('RENAME') + 6).trim()
    if (!name) { term.setStatus('USAGE: SS/RENAME <NAME>'); return }
    const active = getActiveSession(state.session)
    if (!active) { term.setStatus('NO ACTIVE SESSION'); return }
    if (isSessionNameTaken(state.session, name, active.id)) {
      term.setStatus(`NAME "${name.toUpperCase()}" ALREADY TAKEN`)
      return
    }
    active.name = name
    await saveSession(state.session)
    updateHeaderSession(term, state)
    term.setStatus(`SESSION RENAMED: ${name.toUpperCase()}`)
    return
  }

  term.setStatus(`UNKNOWN SESSION COMMAND: SS/${sub}`)
}
