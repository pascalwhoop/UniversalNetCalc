import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'tests/e2e/**', // Exclude Playwright E2E tests - they run separately
      '.worktrees/**', // Exclude git worktrees
      '.cursor/**', // Exclude Cursor worktrees
    ],
  },
})
