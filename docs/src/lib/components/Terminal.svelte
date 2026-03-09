<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    maxWidth = '680px',
    variant = 'dark',
    children,
  }: {
    maxWidth?: string
    variant?: 'dark' | 'green'
    children: Snippet
  } = $props()
</script>

<div class="terminal {variant}" style:max-width={maxWidth}>
  <div class="terminal-header">
    <span class="dot red"></span>
    <span class="dot yellow"></span>
    <span class="dot green"></span>
  </div>
  <div class="terminal-body">
    {@render children()}
  </div>
</div>

<style>
  .terminal {
    border-radius: 10px;
    overflow: hidden;
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    position: relative;
  }

  .terminal.dark {
    background: var(--bg-code);
  }

  .terminal.green {
    background: #0a0a0a;
  }

  .terminal-header {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .terminal.dark .terminal-header {
    background: var(--bg-code-header);
  }

  .terminal.green .terminal-header {
    background: #111;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .dot.red { background: #e06058; }
  .dot.yellow { background: #dba730; }
  .dot.green { background: #5cb870; }

  .terminal-body {
    padding: 20px 24px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    line-height: 1.7;
  }

  .terminal.dark .terminal-body {
    color: #bbb;
  }

  .terminal.green .terminal-body {
    color: #33ff33;
  }
</style>
