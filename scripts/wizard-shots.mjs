// Capture real in-app screenshots used by the onboarding wizard, seeded with
// sample data, and write them optimized to public/wizard/*.webp.
//
// Requires a running preview server (default http://localhost:4173).
// Usage: npm run preview & ; npm run wizard:shots
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../public/wizard')
mkdirSync(OUT, { recursive: true })

const BASE = process.env.BASE_URL || 'http://localhost:4173'
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const SEED = `async () => {
  for (let i=0;i<100 && !window.milkDb;i++) await new Promise(r=>setTimeout(r,50));
  const db = window.milkDb; await db.feeds.clear();
  const now = Date.now(), DAY=86400000, HR=3600000, MIN=60000;
  const small=[30,60,90,120,150], big=[60,120,180,240], fr=[0.25,0.5,0.75,1];
  const rnd=(s)=>{let x=Math.sin(s)*10000;return x-Math.floor(x)};
  const feeds=[]; let s=1;
  for(let d=3;d>=0;d--)for(let i=0;i<7;i++){const t=rnd(s++)>0.5?'big':'small';const sz=(t==='big'?big:small);const sizeMl=sz[Math.floor(rnd(s++)*sz.length)];const f=fr[Math.floor(rnd(s++)*fr.length)];const drunkMl=Math.round(sizeMl*f);const ts=now-d*DAY-i*3*HR-Math.floor(rnd(s++)*HR)-HR;feeds.push({kind:'bottle',timestamp:ts,bottleType:t,sizeMl,fraction:f,drunkMl,wastedMl:sizeMl-drunkMl})}
  const slots=[15,30,45,60];
  for(let d=3;d>=0;d--)for(let i=0;i<2;i++){const side=(d+i)%2===0?'left':'right';const durationMin=slots[Math.floor(rnd(s++)*slots.length)];const ts=now-d*DAY-i*7*HR-2*HR;feeds.push({kind:'breast',timestamp:ts,side,durationMin})}
  feeds.push({kind:'bottle',timestamp:now-8*MIN,bottleType:'big',sizeMl:120,fraction:0.75,drunkMl:90,wastedMl:30});
  await db.feeds.bulkAdd(feeds); return feeds.length;
}`

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({
  baseURL: BASE,
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()
// Don't let the first-launch wizard cover the screenshots.
await page.addInitScript(() => localStorage.setItem('milk-tracer-onboarded', '1'))
await page.addInitScript(`window.__SEED__ = ${SEED}`)
await page.goto('/')
await page.evaluate('window.__SEED__()')
await page.reload()

async function shot(name, prep, testid) {
  await prep()
  const el = page.locator(`[data-testid="${testid}"]`)
  await el.waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  const png = await el.screenshot()
  const webp = await page.evaluate(async (b64) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const maxW = 900
    const scale = Math.min(1, maxW / img.width)
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale)
    c.height = Math.round(img.height * scale)
    const ctx = c.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/webp', 0.9)
  }, png.toString('base64'))
  writeFileSync(resolve(OUT, `${name}.webp`), Buffer.from(webp.split(',')[1], 'base64'))
  console.log(`✓ ${name}.webp`)
}

await shot('shot-log', async () => { await page.getByTestId('nav-log').click() }, 'step-type')
await shot(
  'shot-breast',
  async () => {
    await page.getByTestId('nav-log').click()
    await page.getByTestId('type-breast').click()
    await page.getByTestId('side-left').click()
    await page.getByTestId('slot-30').click()
  },
  'step-duration',
)
await shot('shot-timer', async () => { await page.getByTestId('nav-stats').click() }, 'active-bottle')
// The insights slide uses an animated square tour (scripts/wizard-insights-gif.mjs).

await browser.close()
console.log('done')
