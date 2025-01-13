import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'cypress/**',
      '.idea/**',
      '.git/**',
      '.cache/**',
      '.output/**',
      '.temp/**'
    ],
    environment: 'jsdom'
  }
})
