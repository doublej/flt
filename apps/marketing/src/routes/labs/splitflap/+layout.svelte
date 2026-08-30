<script lang="ts">
import { page } from '$app/stores'

const { children } = $props()
const PAGES = [
  { href: '/labs/splitflap', name: 'Scales' },
  { href: '/labs/splitflap/board', name: 'Board' },
  { href: '/labs/splitflap/photo', name: 'Night counter' },
  { href: '/labs/splitflap/terminal', name: 'Terminal hall' },
  { href: '/labs/splitflap/perf', name: 'Frame budget' },
]
</script>

<div class="lab">
	<nav>
		<span class="brand">Split-flap</span>
		{#each PAGES as p (p.href)}
			<a href={p.href} aria-current={$page.url.pathname === p.href ? 'page' : undefined}>{p.name}</a>
		{/each}
	</nav>
	{@render children()}
</div>

<style>
	.lab {
		max-width: 1120px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 7rem;
		display: grid;
		gap: 2.5rem;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 1.25rem;
		padding-bottom: 0.9rem;
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}
	.brand {
		margin-right: auto;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	a {
		color: var(--color-muted);
		text-decoration: none;
	}
	a[aria-current='page'] {
		color: var(--color-primary);
	}
</style>
