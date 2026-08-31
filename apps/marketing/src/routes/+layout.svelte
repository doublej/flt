<script lang="ts">
import '../app.css'
import { en as copy } from '$lib/i18n/en'
const { children } = $props()

// TODO: swap for the real domain before deploy — the schema below is inert until then.
const SITE = 'https://REPLACE-ME.example'

// No Offer/price markup: engines cache structured prices and repeat them back long
// after they change, and 7/19/39 are still placeholders. Add offers once they are final.
const schema = {
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
      inLanguage: 'en',
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
}

const ld = `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`
</script>

<svelte:head>
  <title>{copy.meta.title}</title>
  <meta name="description" content={copy.meta.description} />
  {@html ld}
</svelte:head>

{@render children()}

<div class="grain" aria-hidden="true"></div>

<style>
  .grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.03;
    z-index: 10;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  }
</style>
