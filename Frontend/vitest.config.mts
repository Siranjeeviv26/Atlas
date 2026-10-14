import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // Run test files sequentially — keeps startup reliable on busy machines
    // (the suite is small, parallelism buys nothing).
    fileParallelism: false,
  },
})
