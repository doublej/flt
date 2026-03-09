import type { AffiliateConfig } from '@flights/core'
import { buildMarkdown, loadSessionScopedSearches } from '@flights/core'
import type { Terminal } from '../terminal'
import { M } from '../terminal'
import type { AppState } from './shared'

export async function doTakeout(cmd: string, raw: string, term: Terminal, state: AppState) {
  const searches = await loadSessionScopedSearches(state.session)
  if (!searches.length) {
    term.setStatus('NO SEARCHES TO EXPORT')
    return
  }

  let title: string | undefined
  const titleMatch = raw.match(/^TO\/TITLE\s+(.+)$/i)
  if (titleMatch) title = titleMatch[1].trim()

  const affiliate: AffiliateConfig | null =
    state.config.marker && state.config.trs
      ? { marker: state.config.marker, trs: state.config.trs }
      : null
  const md = buildMarkdown(searches, [], affiliate, title)

  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5).replace(':', '')
  const outPath = `${process.env.HOME ?? '.'}/Desktop/flights-${date}-${time}.md`

  try {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(outPath, md, 'utf-8')
    term.setContent([
      '', `${M.G} ** TAKEOUT COMPLETE **${M.g}`, '',
      `  ${searches.length} SEARCH${searches.length !== 1 ? 'ES' : ''} EXPORTED`, '',
      `  ${M.y}${outPath}${M.g}`, '',
    ])
    term.setStatus(`EXPORTED TO ${outPath.split('/').pop()}`)
  } catch (e) {
    term.setStatus(`EXPORT FAILED: ${e instanceof Error ? e.message : e}`)
  }
}
