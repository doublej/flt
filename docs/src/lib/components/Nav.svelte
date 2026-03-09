<script lang="ts">
  import { base } from '$app/paths'
  import { page } from '$app/state'

  const links = [
    { href: `${base}/`, label: 'Home' },
    { href: `${base}/features`, label: 'Features' },
    { href: 'https://github.com/doublej/flt', label: 'GitHub', external: true },
  ]

  function isActive(href: string): boolean {
    if (href.startsWith('http')) return false
    const path = page.url?.pathname ?? ''
    if (href === `${base}/`) return path === `${base}/` || path === base
    return path.startsWith(href)
  }
</script>

<nav>
  <div class="nav-inner">
    <a href="{base}/" class="wordmark">flt</a>
    <div class="nav-links">
      {#each links as link}
        <a
          href={link.href}
          class:active={isActive(link.href)}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
        >
          {link.label}
        </a>
      {/each}
    </div>
  </div>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(248, 248, 248, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-inner {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: 0 var(--container-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
  }

  .wordmark {
    font-family: 'DM Mono', monospace;
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-links a {
    font-family: 'Instrument Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }

  .nav-links a:hover {
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.04);
  }

  .nav-links a.active {
    color: var(--text-primary);
  }
</style>
