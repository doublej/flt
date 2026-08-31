<script lang="ts">
import '../app.css'
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
      name: 'Bureau',
      url: SITE,
      description:
        'A paid flight research service. Bureau searches every route and date combination in a brief and returns a PDF report with price charts, ranked options and booking links. It does not sell, book or ticket flights.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#site`,
      url: SITE,
      name: 'Bureau',
      publisher: { '@id': `${SITE}/#org` },
      inLanguage: 'en',
    },
    {
      '@type': 'Service',
      '@id': `${SITE}/#service`,
      name: 'Bureau flight research report',
      serviceType: 'Flight research report',
      provider: { '@id': `${SITE}/#org` },
      description:
        'You brief a route and rough dates. Bureau runs the searches one at a time and sends back a PDF report: price-by-date charts, ranked options with airline, routing and total journey time, and a booking link for each. Prices come from public flight search results at the time of the search, not an airline feed. Bureau does not book or ticket flights.',
    },
  ],
}

const ld = `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`
</script>

<svelte:head>
  <title>Bureau — flight research for people with flexible dates</title>
  <meta
    name="description"
    content="Tell us where you want to go and roughly when. Bureau prices every date you could fly, ranks what comes back and sends you one report with a link to book each option. From €7, and we never book or ticket anything."
  />
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
