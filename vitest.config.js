import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@wod5e': path.resolve(__dirname, './'),
      '#system': path.resolve(__dirname, './system/')
    }
  }
})
