import { page } from '$app/state'
import { en } from './en'
import { nl } from './nl'

/** The one place that turns the current route's `[[lang]]` param into a
 *  locale and a copy object. Every component that needs translated strings
 *  calls these from inside `$derived(...)` instead of importing `en` or `nl`
 *  directly, so a language switch (a client navigation between `/` and `/nl`)
 *  updates every one of them together. */
export function getLocale(): 'en' | 'nl' {
  return page.params.lang === 'nl' ? 'nl' : 'en'
}

export function getCopy() {
  return getLocale() === 'nl' ? nl : en
}
