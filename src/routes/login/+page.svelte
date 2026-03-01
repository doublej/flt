<script lang="ts">
  import { enhance } from '$app/forms'

  let { form } = $props<{ form?: { error?: string } }>()
</script>

<div class="container">
  <div class="card">
    <h1>Sign in</h1>
    <form method="POST" use:enhance>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}
      <button type="submit">Continue</button>
    </form>
  </div>
</div>

<style>
  .container {
    display: grid;
    place-items: center;
    min-height: 100vh;
    background: var(--color-bg);
  }
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 2rem;
    width: min(360px, 90vw);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  label {
    font-size: 0.875rem;
    color: var(--color-muted);
  }
  input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 1rem;
    outline: none;
  }
  input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-bg);
  }
  .error {
    font-size: 0.875rem;
    color: var(--color-error);
  }
  button {
    padding: 0.625rem 1rem;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    font-size: 1rem;
    cursor: pointer;
    font-weight: 500;
  }
  button:hover {
    background: var(--color-primary-hover);
  }
</style>
