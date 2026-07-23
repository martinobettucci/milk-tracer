// Record a square, looping tour of the stats dashboard and encode it as a GIF
// used on the wizard's "insights" slide. Captures PNG frames while scrolling,
// then encodes them with gifenc (no ffmpeg gif muxer needed).
//
// Requires a running preview server (default http://localhost:4173).
// Usage: npm run preview & ; npm run wizard:gif
import { chromium } from '@playwright/test'
import gifenc from 'gifenc'
import { PNG } from 'pngjs'

const { GIFEncoder, quantize, applyPalette } = gifenc
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../public/wizard')
mkdirSync(OUT, { recursive: true })
const TMP = '/tmp/mt-frames'
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

const BASE = process.env.BASE_URL || 'http://localhost:4173'
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const SIZE = 440
const SCROLL_FRAMES = 30
const HOLD_START = 4
const HOLD_END = 5
const DELAY_MS = 90 // ~11 fps

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

const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

const browser = await chromium.launch({ executablePath: CHROME })
const page = await (
  await browser.newContext({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 })
).newPage()
await page.addInitScript(() => localStorage.setItem('milk-tracer-onboarded', '1'))
await page.addInitScript(`window.__SEED__ = ${SEED}`)
await page.goto(BASE)
await page.evaluate('window.__SEED__()')
await page.reload()
await page.getByTestId('nav-stats').click()
await page.getByTestId('active-bottle').waitFor({ state: 'visible' })
await page.addStyleTag({
  content: `header,nav,[data-testid="update-prompt"],footer{display:none!important}
            main{padding-top:10px!important}`,
})
await page.waitForTimeout(400)

const endY = await page.evaluate(() => {
  const bs = document.querySelector('[data-testid="breast-section"]')
  return bs
    ? Math.max(0, bs.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 24)
    : document.body.scrollHeight - window.innerHeight
})

// Frame plan: hold at top, ease-scroll down, hold at bottom.
const ys = []
for (let i = 0; i < HOLD_START; i++) ys.push(0)
for (let i = 1; i <= SCROLL_FRAMES; i++) ys.push(Math.round(endY * easeInOut(i / SCROLL_FRAMES)))
for (let i = 0; i < HOLD_END; i++) ys.push(endY)

const frames = []
for (const y of ys) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(70)
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: SIZE, height: SIZE } })
  frames.push(PNG.sync.read(buf)) // { width, height, data: RGBA }
}
await browser.close()

// Encode GIF (per-frame palette for the warm gradients).
const gif = GIFEncoder()
for (const f of frames) {
  const data = new Uint8Array(f.data.buffer, f.data.byteOffset, f.data.length)
  const palette = quantize(data, 128, { format: 'rgba4444' })
  const index = applyPalette(data, palette, 'rgba4444')
  gif.writeFrame(index, f.width, f.height, { palette, delay: DELAY_MS })
}
gif.finish()
const bytes = gif.bytes()
writeFileSync(resolve(OUT, 'insights.gif'), Buffer.from(bytes))
console.log(`✓ public/wizard/insights.gif (${(bytes.length / 1024) | 0}KB, ${frames.length} frames)`)
