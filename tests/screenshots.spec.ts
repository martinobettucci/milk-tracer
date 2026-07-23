import { test, expect, type Page } from '@playwright/test'
import { SEED_FN } from './seed'

const SHOT_DIR = 'screenshots'

async function seed(page: Page) {
  await page.addInitScript(`window.__SEED__ = ${SEED_FN}`)
  await page.goto('/')
  const count = await page.evaluate('window.__SEED__()')
  expect(Number(count)).toBeGreaterThan(0)
  await page.reload()
}

// Storage must be primed before the app loads. addInitScript runs on every
// navigation (including reload), so register it before goto/seed.
async function setLang(page: Page, lang: string) {
  await page.addInitScript((l) => localStorage.setItem('milk-tracer-lang', l as string), lang)
}
async function setTheme(page: Page, theme: string) {
  await page.addInitScript((t) => localStorage.setItem('milk-tracer-theme', t as string), theme)
}

// The bottom nav is position:fixed and floats mid-page in a fullPage capture.
// Hide it for long dashboard screenshots so charts aren't obscured.
async function hideNav(page: Page) {
  await page.addStyleTag({ content: 'nav{display:none!important}' })
}

test('01 empty state', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const db = (window as unknown as { milkDb?: { feeds: { clear: () => Promise<void> } } }).milkDb
    await db?.feeds.clear()
  })
  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('empty-cta')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/01-empty.png`, fullPage: true })
})

test('02 log flow — every step', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('nav-log').click()

  await expect(page.getByTestId('step-type')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/02a-log-type.png`, fullPage: true })

  await page.getByTestId('type-big').click()
  await expect(page.getByTestId('step-size')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/02b-log-size.png`, fullPage: true })

  await page.getByTestId('size-180').click()
  await expect(page.getByTestId('step-fraction')).toBeVisible()
  await page.getByTestId('fraction-3-4').click()
  await page.screenshot({ path: `${SHOT_DIR}/02c-log-fraction.png`, fullPage: true })

  await page.getByTestId('save-feed').click()
  await expect(page.getByTestId('step-done')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/02d-log-done.png`, fullPage: true })
})

test('03 dashboard (light, desktop)', async ({ page }) => {
  await seed(page)
  await expect(page.getByTestId('nav-stats')).toBeVisible()
  await page.getByTestId('nav-stats').click()
  await page.waitForTimeout(600) // let recharts animate in
  await hideNav(page)
  await page.screenshot({ path: `${SHOT_DIR}/03-dashboard-light.png`, fullPage: true })
})

test('04 dashboard (dark)', async ({ page }) => {
  await setTheme(page, 'dark')
  await seed(page)
  await page.getByTestId('nav-stats').click()
  await page.waitForTimeout(600)
  await hideNav(page)
  await page.screenshot({ path: `${SHOT_DIR}/04-dashboard-dark.png`, fullPage: true })
})

test('05 dashboard (mobile 390x844)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.getByTestId('nav-stats').click()
  await page.waitForTimeout(600)
  await hideNav(page)
  await page.screenshot({ path: `${SHOT_DIR}/05-dashboard-mobile.png`, fullPage: true })
})

test('06 history table + edit row', async ({ page }) => {
  await seed(page)
  await page.getByTestId('nav-stats').click()
  await page.waitForTimeout(400)
  const firstRow = page.getByTestId('feed-row').first()
  await firstRow.getByText(/edit/i).click().catch(() => undefined)
  await hideNav(page)
  await page.screenshot({ path: `${SHOT_DIR}/06-history-edit.png`, fullPage: true })
})

test('07 data & settings panel', async ({ page }) => {
  await seed(page)
  await page.getByTestId('nav-data').click()
  await expect(page.getByTestId('language-select')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/07-data-panel.png`, fullPage: true })
})

test('08 localized — French', async ({ page }) => {
  await setLang(page, 'fr')
  await seed(page)
  await page.getByTestId('nav-stats').click()
  await page.waitForTimeout(500)
  await hideNav(page)
  await page.screenshot({ path: `${SHOT_DIR}/08-dashboard-fr.png`, fullPage: true })
})

test('09 localized — Italian log flow', async ({ page }) => {
  await setLang(page, 'it')
  await page.goto('/')
  await page.getByTestId('nav-log').click()
  await page.getByTestId('type-small').click()
  await page.getByTestId('size-90').click()
  await expect(page.getByTestId('step-fraction')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/09-log-it.png`, fullPage: true })
})

test('10 log type incl. breast', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('nav-log').click()
  await expect(page.getByTestId('type-breast')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/10-log-type3.png`, fullPage: true })
})

test('11 breast flow — side + duration', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('nav-log').click()
  await page.getByTestId('type-breast').click()
  await expect(page.getByTestId('step-side')).toBeVisible()
  await page.screenshot({ path: `${SHOT_DIR}/11a-breast-side.png`, fullPage: true })
  await page.getByTestId('side-left').click()
  await expect(page.getByTestId('step-duration')).toBeVisible()
  await page.getByTestId('slot-30').click()
  await page.waitForTimeout(200) // let the active-slot highlight settle
  await page.screenshot({ path: `${SHOT_DIR}/11b-breast-duration.png`, fullPage: true })
})

test('12 active-bottle timer + reclaim', async ({ page }) => {
  await seed(page)
  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('active-bottle')).toBeVisible()
  // capture just the active-bottle card (the interesting part)
  await page.getByTestId('active-bottle').screenshot({ path: `${SHOT_DIR}/12-active-bottle.png` })
})

test('13 breast stats section', async ({ page }) => {
  await seed(page)
  await page.getByTestId('nav-stats').click()
  await expect(page.getByTestId('breast-section')).toBeVisible()
  await page.getByTestId('breast-section').scrollIntoViewIfNeeded()
  await page.getByTestId('breast-section').screenshot({ path: `${SHOT_DIR}/13-breast-stats.png` })
})

test('14 data panel — safety timer setting', async ({ page }) => {
  await seed(page)
  await page.getByTestId('nav-data').click()
  await expect(page.getByTestId('timer-90')).toBeVisible()
  await page.getByTestId('timer-90').click()
  await page.screenshot({ path: `${SHOT_DIR}/14-data-timer.png`, fullPage: true })
})
