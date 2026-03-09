import { isValidKey, saveConfig } from '@flights/core'
import type { Terminal } from '../terminal'
import { M } from '../terminal'
import { contextHelp } from '../format/utils'
import type { AppState } from './shared'

export async function handleConfig(cmd: string, _raw: string, term: Terminal, state: AppState) {
  const sub = cmd.slice(3).trim()

  // CF/ — show all config
  if (!sub) {
    const entries = Object.entries(state.config).filter(([, v]) => v != null)
    if (!entries.length) {
      term.setContent(['', `${M.G} ** CONFIG **${M.g}`, '', `  ${M.y}NO CONFIG SET${M.g}`, `${M.d}  USE CF/KEY=VALUE TO SET DEFAULTS${M.g}`, '', ...contextHelp('config')])
      term.setStatus('CONFIG EMPTY')
      return
    }
    const lines = ['', `${M.G} ** CONFIG **${M.g}`, '']
    for (const [k, v] of entries) lines.push(`  ${M.G}${k.toUpperCase()}${M.g}  =  ${v}`)
    lines.push('')
    lines.push(...contextHelp('config'))
    term.setContent(lines)
    term.setStatus(`${entries.length} KEY${entries.length !== 1 ? 'S' : ''} SET`)
    return
  }

  // CF/KEY=VALUE or CF/KEY= (unset)
  const setMatch = sub.match(/^([A-Z]+)=(.*)$/)
  if (setMatch) {
    const key = setMatch[1].toLowerCase()
    const val = setMatch[2]
    if (!isValidKey(key)) {
      term.setStatus(`UNKNOWN KEY: ${key.toUpperCase()} - VALID: CURRENCY FMT SEAT PAX LIMIT`)
      return
    }
    if (!val) {
      delete (state.config as Record<string, unknown>)[key]
      await saveConfig(state.config)
      term.setStatus(`UNSET ${key.toUpperCase()}`)
    } else {
      ;(state.config as Record<string, unknown>)[key] = val
      await saveConfig(state.config)
      if (key === 'currency') state.currency = val
      term.setStatus(`${key.toUpperCase()} = ${val}`)
    }
    return
  }

  // CF/KEY — show one key
  const key = sub.toLowerCase()
  if (isValidKey(key)) {
    const val = (state.config as Record<string, unknown>)[key]
    term.setStatus(val != null ? `${key.toUpperCase()} = ${val}` : `${key.toUpperCase()} NOT SET`)
    return
  }

  term.setStatus(`UNKNOWN KEY: ${sub} - VALID: CURRENCY FMT SEAT PAX LIMIT`)
}
