import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  // HMR off: the labs pages hold a lot of hand-tuned state and a hot reload
  // throws it away. Reload by hand after an edit.
  server: { port: 3848, hmr: false },
})
