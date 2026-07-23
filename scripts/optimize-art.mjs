// Downscale + compress the generated art for the web using the bundled
// Chromium canvas (no native image libs needed).
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ART = resolve(here, '../art-src') // raw full-res source PNGs
const PUB = resolve(here, '../public')

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage()

async function convert(srcAbs, w, h, mime, quality) {
  const data = readFileSync(srcAbs).toString('base64')
  const out = await page.evaluate(
    async ({ d, w, h, mime, quality }) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + d
      await img.decode()
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      return c.toDataURL(mime, quality)
    },
    { d: data, w, h, mime, quality },
  )
  return Buffer.from(out.split(',')[1], 'base64')
}

const webp = [
  { src: 'empty-hero.png', out: 'art/empty-hero.webp', w: 560, h: 560, q: 0.85 },
  { src: 'bottle-small.png', out: 'art/bottle-small.webp', w: 320, h: 320, q: 0.9 },
  { src: 'bottle-big.png', out: 'art/bottle-big.webp', w: 320, h: 320, q: 0.9 },
  { src: 'breast.png', out: 'art/breast.webp', w: 320, h: 320, q: 0.9 },
  { src: 'bg-pattern.png', out: 'art/bg-pattern.webp', w: 640, h: 960, q: 0.8 },
]
for (const j of webp) {
  const buf = await convert(resolve(ART, j.src), j.w, j.h, 'image/webp', j.q)
  writeFileSync(resolve(PUB, j.out), buf)
  console.log(`✓ ${j.out} (${(buf.length / 1024) | 0}KB)`)
}

// PWA + favicon PNGs from the warm app icon.
const icons = [
  { out: 'icon-192.png', w: 192, h: 192 },
  { out: 'icon-512.png', w: 512, h: 512 },
  { out: 'apple-touch-icon.png', w: 180, h: 180 },
  { out: 'favicon-64.png', w: 64, h: 64 },
]
for (const j of icons) {
  const buf = await convert(resolve(ART, 'app-icon.png'), j.w, j.h, 'image/png', 1)
  writeFileSync(resolve(PUB, j.out), buf)
  console.log(`✓ ${j.out} (${(buf.length / 1024) | 0}KB)`)
}

await browser.close()
console.log('done')
