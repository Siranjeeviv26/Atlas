import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
