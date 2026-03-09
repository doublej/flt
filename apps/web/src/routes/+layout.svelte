<script>
import '../app.css'
const { children } = $props()
</script>

<div class="app">
  {@render children()}
</div>

<style>
  .app {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
    position: relative;
  }
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.03;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    z-index: 0;
  }
</style>
