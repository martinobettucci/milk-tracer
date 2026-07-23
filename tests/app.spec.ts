import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'

// ---- helpers ------------------------------------------------------------

/** Fresh app: onboarding suppressed, IndexedDB cleared. */
async function fresh(page: Page) {
  await page.addInitScript(() => localStorage.setItem('milk-tracer-onboarded', '1'))
  await page.goto('/')
  await page.evaluate(async () => {
    const w = window as unknown as { milkDb?: { feeds: { clear: () => Promise<void> } } }
    for (let i = 0; i < 100 && !w.milkDb; i++) await new Promise((r) => setTimeout(r, 50))
    await w.milkDb!.feeds.clear()
  })
}

type Row = {
  kind: string
  sizeMl?: number
  drunkMl?: number
  wastedMl?: number
  side?: string
  durationMin?: number
}
const feeds = (page: Page): Promise<Row[]> =>
  page.evaluate(() => {
    const w = window as unknown as { milkDb: { feeds: { orderBy: (k: string) => { toArray: () => Promise<Row[]> } } } }
    return w.milkDb.feeds.orderBy('timestamp').toArray()
  })
const count = (page: Page) => feeds(page).then((f) => f.length)
const getSetting = (page: Page, key: string) =>
  page.evaluate((k) => {
    const w = window as unknown as { milkDb: { settings: { get: (k: string) => Promise<{ value: string } | undefined> } } }
    return w.milkDb.settings.get(k).then((s) => s?.value)
  }, key)

async function logBottle(page: Page, type: 'small' | 'big', size: number, frac: '0-4' | '1-4' | '2-4' | '3-4' | '4-4') {
  await page.getByTestId('nav-log').click()
  await expect(page.getByTestId('step-type')).toBeVisible()
  await page.getByTestId(`type-${type}`).click()
  await page.getByTestId(`size-${size}`).click()
  await page.getByTestId(`fraction-${frac}`).click()
  await page.getByTestId('save-feed').click()
  await expect(page.getByTestId('step-done')).toBeVisible()
}

async function logBreast(page: Page, side: 'left' | 'right', minutes: number) {
  await page.getByTestId('nav-log').click()
  await page.getByTestId('type-breast').click()
  await page.getByTestId(`side-${side}`).click()
  await page.getByTestId(`slot-${minutes}`).click()
  await page.getByTestId('save-breast').click()
  await expect(page.getByTestId('step-done')).toBeVisible()
}

// ---- tests --------------------------------------------------------------

test('logs several feeds in a row via the Log tab (regression: 2nd feed)', async ({ page }) => {
  await fresh(page)

  await logBottle(page, 'small', 60, '2-4')
  expect(await count(page)).toBe(1)

  // Tapping the Log tab again must return a fresh form, not stay on "saved".
  await page.getByTestId('nav-log').click()
  await expect(page.getByTestId('step-type')).toBeVisible()
  await logBottle(page, 'big', 120, '4-4')
  expect(await count(page)).toBe(2)

  // ...and a third, mixing in a breast feed.
  await logBreast(page, 'left', 30)
  expect(await count(page)).toBe(3)

  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('feed-row')).toHaveCount(3)
})

test('a 0/4 feed saves as nothing drunk, all wasted', async ({ page }) => {
  await fresh(page)
  await logBottle(page, 'big', 120, '0-4') // 0 drunk, 120 wasted
  const rows = await feeds(page)
  expect(rows).toHaveLength(1)
  expect(rows[0]).toMatchObject({ sizeMl: 120, drunkMl: 0, wastedMl: 120 })
})

test('dashboard totals match what was logged', async ({ page }) => {
  await fresh(page)
  await logBottle(page, 'small', 60, '4-4') // drunk 60, wasted 0
  await logBottle(page, 'big', 120, '2-4') // drunk 60, wasted 60

  const rows = await feeds(page)
  expect(rows.map((r) => [r.sizeMl, r.drunkMl, r.wastedMl])).toEqual([
    [60, 60, 0],
    [120, 60, 60],
  ])

  await page.getByTestId('nav-stats').click()
  const totalDrunk = page.locator('.card', { hasText: /total drunk/i })
  await expect(totalDrunk).toContainText('120')
})

test('reclaiming leftover milk turns waste into drunk', async ({ page }) => {
  await fresh(page)
  await logBottle(page, 'big', 120, '3-4') // drunk 90, wasted 30 — logged "now"

  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('active-bottle')).toBeVisible()
  await expect(page.getByTestId('reclaim-give')).toBeVisible()
  await page.getByTestId('reclaim-give').click() // slider defaults to the full 30 ml

  await expect.poll(async () => (await feeds(page))[0]).toMatchObject({ drunkMl: 120, wastedMl: 0 })
  await expect(page.getByTestId('active-bottle')).toContainText(/no waste/i)
})

test('editing a feed updates its numbers', async ({ page }) => {
  await fresh(page)
  await logBottle(page, 'small', 60, '2-4') // drunk 30, wasted 30

  await page.getByTestId('nav-stats').click()
  await page.getByTestId('feed-row').getByText('Edit').click()
  await page.locator('select').first().selectOption('120') // size 60 -> 120
  await page.getByText('Save', { exact: true }).click()

  await expect.poll(async () => (await feeds(page))[0]).toMatchObject({ sizeMl: 120, drunkMl: 60, wastedMl: 60 })
})

test('deleting the only feed returns the empty state', async ({ page }) => {
  await fresh(page)
  await logBottle(page, 'small', 90, '4-4')

  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('feed-row')).toHaveCount(1)
  await page.getByTestId('delete-feed').click()

  await expect(page.getByTestId('empty-cta')).toBeVisible()
  expect(await count(page)).toBe(0)
})

test('breast feeding shows up in its stats section', async ({ page }) => {
  await fresh(page)
  await logBreast(page, 'left', 30)
  await logBreast(page, 'right', 15)

  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('breast-section')).toBeVisible()
  // avg per session = (30 + 15) / 2 = ~23 min
  await expect(page.getByTestId('breast-section')).toContainText(/23\s*m/)
})

test('safety-timer setting persists across reloads', async ({ page }) => {
  await fresh(page)
  await page.getByTestId('nav-data').click()
  await page.getByTestId('timer-90').click()
  expect(await getSetting(page, 'bottleTimerMin')).toBe('90')

  await page.reload()
  await page.getByTestId('nav-data').click()
  await expect(page.getByTestId('timer-90')).toHaveClass(/chip-active/)
})

test('language override switches the interface', async ({ page }) => {
  await fresh(page)
  await page.getByTestId('nav-data').click()
  await page.getByTestId('language-select').selectOption('fr')
  await expect(page.getByTestId('nav-log')).toContainText('Ajouter')
})

test('onboarding wizard shows on first launch and reopens from the Guide button', async ({ page }) => {
  // First launch: NOT onboarded.
  await page.goto('/')
  await expect(page.getByTestId('wizard')).toBeVisible()
  await page.getByTestId('wizard-skip').click()
  await expect(page.getByTestId('wizard')).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('milk-tracer-onboarded'))).toBe('1')

  await page.getByTestId('nav-guide').click()
  await expect(page.getByTestId('wizard')).toBeVisible()
})
