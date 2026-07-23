// Render a branded 1200x630 social-share card to public/og-image.png using the
// bundled Chromium. Composes the app icon + bottle/breast art on a warm card.
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const PUB = resolve(here, '../public')
const b64 = (p, mime) => `data:${mime};base64,` + readFileSync(resolve(PUB, p)).toString('base64')

const icon = b64('icon-512.png', 'image/png')
const bottle = b64('art/bottle-big.webp', 'image/webp')
const breast = b64('art/breast.webp', 'image/webp')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  .card {
    width: 1200px; height: 630px; position: relative; overflow: hidden;
    background:
      radial-gradient(900px 500px at 80% -10%, #ffd9c7 0%, rgba(255,217,199,0) 60%),
      linear-gradient(135deg, #fff7f1 0%, #ffe7dc 100%);
    display: flex; align-items: center; gap: 56px; padding: 0 84px;
  }
  .icon { width: 288px; height: 288px; border-radius: 64px; box-shadow: 0 30px 60px -20px rgba(196,71,44,.35); flex: none; }
  .title { font-size: 84px; font-weight: 800; color: #c4472c; letter-spacing: -1px; line-height: 1; }
  .sub { font-size: 34px; font-weight: 700; color: #9a5a44; margin-top: 14px; }
  .tag { font-size: 30px; color: #8a6b5c; margin-top: 22px; max-width: 620px; line-height: 1.35; }
  .credit { position: absolute; bottom: 34px; right: 44px; font-size: 22px; color: #b98a78; }
  .doodle { position: absolute; opacity: .9; }
  .d1 { width: 150px; bottom: -18px; left: 300px; transform: rotate(-8deg); }
  .d2 { width: 130px; top: -14px; right: 70px; transform: rotate(10deg); }
</style></head><body>
  <div class="card">
    <img class="icon" src="${icon}" />
    <div>
      <div class="title">Milk Tracer</div>
      <div class="sub">Newborn feeding tracker</div>
      <div class="tag">Track every feed — bottle or breast — and waste less milk. Cozy, private and offline.</div>
    </div>
    <img class="doodle d1" src="${bottle}" />
    <img class="doodle d2" src="${breast}" />
    <div class="credit">made with ♥ &amp; AI · p2enjoy.studio</div>
  </div>
</body></html>`

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(200)
const buf = await page.locator('.card').screenshot({ type: 'png' })
writeFileSync(resolve(PUB, 'og-image.png'), buf)
console.log(`✓ og-image.png (${(buf.length / 1024) | 0}KB)`)
await browser.close()
