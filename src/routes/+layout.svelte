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
  }
</style>
