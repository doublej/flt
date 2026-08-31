<script lang="ts">
import { page } from '$app/state'
import { getCopy, getLocale } from '$lib/i18n/copy.svelte'

const { children } = $props()
const copy = $derived(getCopy())
const locale = $derived(getLocale())

// TODO: swap for the real domain before deploy — the schema and the alternate
// links below are inert until then.
const SITE = 'https://REPLACE-ME.example'

/** The path with any `/nl` prefix stripped, so the two locale URLs for the
 *  same page ("/status" and "/nl/status") can be built from one value. */
const subpath = $derived(page.url.pathname.replace(/^\/nl(?=\/|$)/, '') || '/')
const enHref = $derived(`${SITE}${subpath === '/' ? '' : subpath}`)
const nlHref = $derived(`${SITE}/nl${subpath === '/' ? '' : subpath}`)
const canonicalHref = $derived(locale === 'nl' ? nlHref : enHref)

// No Offer/price markup: engines cache structured prices and repeat them back long
// after they change, and 7/19/39 are still placeholders. Add offers once they are final.
const schema = $derived({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: copy.meta.orgName,
      url: SITE,
      description: copy.meta.orgDescription,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#site`,
      url: SITE,
      name: copy.meta.siteName,
      publisher: { '@id': `${SITE}/#org` },
      inLanguage: locale,
    },
    {
      '@type': 'Service',
      '@id': `${SITE}/#service`,
      name: copy.meta.serviceName,
      serviceType: copy.meta.serviceType,
      provider: { '@id': `${SITE}/#org` },
      description: copy.meta.serviceDescription,
    },
  ],
})

const ld = $derived(`<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`)
</script>

<svelte:head>
  <title>{copy.meta.title}</title>
  <meta name="description" content={copy.meta.description} />
  <link rel="canonical" href={canonicalHref} />
  <link rel="alternate" hreflang="en" href={enHref} />
  <link rel="alternate" hreflang="nl" href={nlHref} />
  <link rel="alternate" hreflang="x-default" href={enHref} />
  {@html ld}
</svelte:head>

{@render children()}
