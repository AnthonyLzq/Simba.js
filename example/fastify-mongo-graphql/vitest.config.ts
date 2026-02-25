import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' }
    })
  ],
  test: {
    testTimeout: 60_000,
    fileParallelism: false,
    setupFiles: ['dotenv/config']
  }
})
