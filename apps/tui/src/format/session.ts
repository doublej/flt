import type { Session, SessionState, SessionSearch } from '@flights/core'
import { M } from '../terminal'
import { contextHelp, col, rCol, div } from './utils'

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
    lines.push(`${M.d}         STARTED ${formatAge(Date.now() - active.startedAt)}  ${active.searchRefs.length} SEARCHES  ${(active.favorites?.length ?? 0)} FAVORITES${M.g}`)
  } else {
    lines.push(`  ${M.y}NO ACTIVE SESSION${M.g}`)
    lines.push(`${M.d}  USE SS/START [NAME] TO BEGIN${M.g}`)
  }
  lines.push('')
  lines.push(`  ${state.sessions.length} TOTAL SESSION${state.sessions.length !== 1 ? 'S' : ''}`)
  lines.push('')
  lines.push(...contextHelp('session'))
  return lines
}

export function sessionList(state: SessionState): string[] {
  const lines = ['', `${M.G} ** SESSION LIST **${M.g}`, '']
  if (!state.sessions.length) {
    lines.push(`  ${M.y}NO SESSIONS${M.g}`)
    lines.push('')
    return lines
  }
  for (let i = 0; i < state.sessions.length; i++) {
    if (i > 0) lines.push(`${M.d}  ─────────────────────────────────${M.g}`)
    const s = state.sessions[i]
    const isActive = s.id === state.activeSessionId
    const status = isActive ? `${M.Y}ACTIVE${M.g}` : (s.closedAt ? `${M.d}CLOSED${M.g}` : `${M.d}IDLE${M.g}`)
    lines.push(`  ${M.G}${s.id.toUpperCase()}${M.g}  ${s.name}  ${status}`)
    lines.push(`${M.d}       ${s.searchRefs.length} SEARCHES  ${(s.favorites?.length ?? 0)} FAVS  STARTED ${formatAge(Date.now() - s.startedAt)}${M.g}`)
  }
  lines.push('')
  lines.push(...contextHelp('session'))
  return lines
}

export function sessionRefs(refs: string[], searches: Record<string, SessionSearch>): string[] {
  const lines = ['', `${M.G} ** SEARCH REFS **${M.g}`, '']
  if (!refs.length) {
    lines.push(`  ${M.y}NO SEARCHES IN SESSION${M.g}`)
    lines.push('')
    return lines
  }
  const W = { ln: 3, ref: 30, query: 34, offers: 6 }

  lines.push(`${M.d}  ${rCol('#', W.ln)}  ${col('REF', W.ref)}  ${col('QUERY', W.query)}  ${col('OFFERS', W.offers)}${M.g}`)
  lines.push(`${M.d}  ${div(W.ln)}  ${div(W.ref)}  ${div(W.query)}  ${div(W.offers)}${M.g}`)
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i]
    const search = searches[ref]
    const ln = rCol(String(i + 1), W.ln)
    const refStr = col(ref, W.ref)
    const query = col(search?.query ?? '', W.query)
    const count = rCol(String(search?.offerCount ?? 0), W.offers)
    lines.push(`  ${M.G}${ln}${M.g}  ${refStr}  ${query}  ${count}`)
  }
  lines.push('')
  return lines
}
