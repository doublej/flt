import type { ParamMatcher } from '@sveltejs/kit'

/** Matches the `[[lang=lang]]` segment. Only `nl` is a real locale prefix —
 *  everything else falls through to the unprefixed (English) route, so this
 *  never swallows `/status`, `/api/*` or `/labs/*`. */
export const match: ParamMatcher = (param) => param === 'nl'
