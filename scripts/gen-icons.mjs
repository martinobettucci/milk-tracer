// Render the app SVG icon to PNG at PWA sizes using the bundled Chromium.
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(resolve(here, '../public/favicon.svg'), 'utf8')

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<!doctype html><html><body style="margin:0">
       <div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>
     </body></html>`,
  )
  const el = await page.$('svg')
  const buf = await el.screenshot({ omitBackground: true })
  writeFileSync(resolve(here, `../public/icon-${size}.png`), buf)
  console.log(`wrote icon-${size}.png`)
  await page.close()
}
await browser.close()
