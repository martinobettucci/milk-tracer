import { test as base, expect } from '@playwright/test'

// Every test automatically fails if the page logs a console error or throws.
// This is the guard that keeps the app free of runtime errors/warnings.
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use, testInfo) => {
      const problems: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push(`console.error: ${m.text()}`)
      })
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
      await use()
      // Favicon 404s (if any) are irrelevant noise; everything else must be clean.
      const real = problems.filter((p) => !/favicon\.ico/.test(p))
      expect(real, `no console errors/exceptions in "${testInfo.title}"`).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
