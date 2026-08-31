<script lang="ts">
import '../app.css'
/* Language-agnostic on purpose: this wraps every route in the app, including
   the /labs tuning pages, which have never carried Bureau's SEO meta or JSON-LD.
   That per-locale head content now lives one level down, in the [[lang]] layout
   that only the marketing pages sit under. */
const { children } = $props()
</script>

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
