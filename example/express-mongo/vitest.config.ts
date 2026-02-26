import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths()
  ],
  test: {
    testTimeout: 60_000,
    fileParallelism: false,
    setupFiles: ['dotenv/config']
  }
})
