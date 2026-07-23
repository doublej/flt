import { defineConfig } from 'vitest/config'

// Includes @flights/core tests — the CLI is core's primary consumer and the
// only workspace member with a vitest install (apps/web has no test files).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', '../../packages/core/src/**/*.test.ts'],
  },
})
