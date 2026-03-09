import type { Session, SessionState } from '@flights/core'
import { M } from '../terminal'

function formatAge(ms: number): string {
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins}M AGO`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}H AGO`
  return `${Math.round(hours / 24)}D AGO`
}

export function sessionStatus(active: Session | null, state: SessionState): string[] {
  const lines = ['', `${M.G} ** SESSION STATUS **${M.g}`, '']
  if (active) {
    lines.push(`  ${M.G}ACTIVE${M.g}  ${active.name}  (${active.id})`)
    lines.push(`${M.d}         STARTED ${formatAge(Date.now() - active.startedAt)}  ${active.searchRefs.length} SEARCHES${M.g}`)
  } else {
    lines.push(`  ${M.y}NO ACTIVE SESSION${M.g}`)
    lines.push(`${M.d}  USE SS/START [NAME] TO BEGIN${M.g}`)
  }
  lines.push('')
  lines.push(`  ${state.sessions.length} TOTAL SESSION${state.sessions.length !== 1 ? 'S' : ''}`)
  lines.push('')
  return lines
}

export function sessionList(state: SessionState): string[] {
  const lines = ['', `${M.G} ** SESSION LIST **${M.g}`, '']
  if (!state.sessions.length) {
    lines.push(`  ${M.y}NO SESSIONS${M.g}`)
    lines.push('')
    return lines
  }
  for (const s of state.sessions) {
    const isActive = s.id === state.activeSessionId
    const status = isActive ? `${M.Y}ACTIVE${M.g}` : (s.closedAt ? `${M.d}CLOSED${M.g}` : `${M.d}IDLE${M.g}`)
    lines.push(`  ${M.G}${s.id.toUpperCase()}${M.g}  ${s.name}  ${status}`)
    lines.push(`${M.d}       ${s.searchRefs.length} SEARCHES  STARTED ${formatAge(Date.now() - s.startedAt)}${M.g}`)
  }
  lines.push('')
  return lines
}
