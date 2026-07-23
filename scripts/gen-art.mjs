// Generate cozy, warm UI art with OpenAI gpt-image-1 (low quality) and save
// to public/art/. Re-run to regenerate. Requires OPENAI_KEY in the env.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
// Raw full-res PNGs land here (git-ignored); optimize-art.mjs turns them into
// the web assets under public/.
const OUT = resolve(here, '../art-src')
mkdirSync(OUT, { recursive: true })

const key = process.env.OPENAI_KEY
if (!key) throw new Error('OPENAI_KEY not set')

const COZY =
  'cozy, warm, soft flat vector illustration, gentle pastel palette of cream, peach, ' +
  'soft coral, butter yellow and warm rose, rounded shapes, friendly, minimal, soft shadows, tender nursery mood'

// For transparency to actually take, the prompt must NOT ask for any glow,
// gradient, backdrop or scenery — only the die-cut subject itself.
const ISOLATE =
  'die-cut sticker, the subject only, completely isolated on a fully transparent ' +
  'background, no background, no backdrop, no gradient, no glow, no scenery, clean crisp edges'

const JOBS = [
  {
    file: 'empty-hero.png',
    size: '1024x1024',
    transparent: true,
    prompt: `A single cute sleeping baby milk bottle character with a little peach sleeping night-cap, closed happy eyes and rosy cheeks, resting on one small fluffy cloud, one small crescent moon and two tiny stars beside it. ${COZY}. ${ISOLATE}.`,
  },
  {
    file: 'bottle-small.png',
    size: '1024x1024',
    transparent: true,
    prompt: `One small short cute baby milk bottle with measurement lines, a gentle smile and rosy cheeks, front view, centered. ${COZY}. ${ISOLATE}.`,
  },
  {
    file: 'bottle-big.png',
    size: '1024x1024',
    transparent: true,
    prompt: `One tall large cute baby milk bottle with measurement lines, a gentle smile and rosy cheeks, front view, centered. ${COZY}. ${ISOLATE}.`,
  },
  {
    file: 'bg-pattern.png',
    size: '1024x1536',
    transparent: true,
    prompt: `A sparse scattered arrangement of small simple nursery doodles — a few tiny baby bottles, little clouds, small stars and small hearts — spread out with lots of empty space between them. Thin flat pale peach and warm rose shapes only, no outlines box. ${COZY}. ${ISOLATE}. There must be nothing between the doodles, only transparency.`,
  },
  {
    file: 'breast.png',
    size: '1024x1024',
    transparent: true,
    prompt: `A wholesome, tender minimal icon: the warm rounded silhouette of a mother gently cradling and nursing her baby, viewed from the side, soft and modest, no explicit detail, just a loving simple shape. ${COZY}. ${ISOLATE}.`,
  },
  {
    file: 'app-icon.png',
    size: '1024x1024',
    transparent: false,
    prompt: `App icon: a single cute baby milk bottle centered on a warm cream to peach radial gradient background, rounded, soft, glowing. ${COZY}. Bold, simple, recognizable at small sizes, generous margins.`,
  },
]

// Optional CLI filter: `node gen-art.mjs empty-hero.png bottle-small.png`
const only = process.argv.slice(2)
const SELECTED = only.length ? JOBS.filter((j) => only.includes(j.file)) : JOBS

async function gen(job, attempt = 1) {
  const body = {
    model: 'gpt-image-1',
    prompt: job.prompt,
    n: 1,
    size: job.size,
    quality: 'low',
    output_format: 'png',
    ...(job.transparent ? { background: 'transparent' } : {}),
  }
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    if (attempt < 3) {
      console.warn(`retry ${job.file} (${res.status})`)
      await new Promise((r) => setTimeout(r, attempt * 3000))
      return gen(job, attempt + 1)
    }
    throw new Error(`${job.file} failed: ${res.status} ${txt.slice(0, 200)}`)
  }
  const j = await res.json()
  writeFileSync(resolve(OUT, job.file), Buffer.from(j.data[0].b64_json, 'base64'))
  console.log(`✓ ${job.file}`)
}

// small concurrency
const queue = [...SELECTED]
const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const job = queue.shift()
    await gen(job)
  }
})
await Promise.all(workers)
console.log('done')
