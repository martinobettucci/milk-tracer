import Dexie, { type Table } from 'dexie'
import type { BottleType, Fraction } from '../lib/presets'
import { drunkMl } from '../lib/presets'

export interface Feed {
  id?: number
  timestamp: number // ms epoch — when the feed happened
  bottleType: BottleType
  sizeMl: number // prepared amount
  fraction: Fraction // proportion actually drunk
  drunkMl: number // sizeMl * fraction (rounded)
  wastedMl: number // sizeMl - drunkMl
}

export interface Setting {
  key: string
  value: string
}

export class MilkTracerDB extends Dexie {
  feeds!: Table<Feed, number>
  settings!: Table<Setting, string>

  constructor() {
    super('milk-tracer')
    this.version(1).stores({
      feeds: '++id, timestamp',
      settings: 'key',
    })
  }
}

export const db = new MilkTracerDB()

// Expose the Dexie handle for e2e seeding (harmless for a local-only app).
if (typeof window !== 'undefined') {
  ;(window as unknown as { milkDb: MilkTracerDB }).milkDb = db
}

// ---- Feed helpers -------------------------------------------------------

export async function addFeed(input: {
  timestamp: number
  bottleType: BottleType
  sizeMl: number
  fraction: Fraction
}): Promise<number> {
  const drunk = drunkMl(input.sizeMl, input.fraction)
  return db.feeds.add({
    timestamp: input.timestamp,
    bottleType: input.bottleType,
    sizeMl: input.sizeMl,
    fraction: input.fraction,
    drunkMl: drunk,
    wastedMl: input.sizeMl - drunk,
  })
}

export async function updateFeed(
  id: number,
  patch: Partial<Pick<Feed, 'timestamp' | 'sizeMl' | 'fraction' | 'bottleType'>>,
): Promise<void> {
  const existing = await db.feeds.get(id)
  if (!existing) return
  const sizeMl = patch.sizeMl ?? existing.sizeMl
  const fraction = patch.fraction ?? existing.fraction
  const drunk = drunkMl(sizeMl, fraction)
  await db.feeds.update(id, {
    ...patch,
    sizeMl,
    fraction,
    drunkMl: drunk,
    wastedMl: sizeMl - drunk,
  })
}

export async function deleteFeed(id: number): Promise<void> {
  await db.feeds.delete(id)
}

// ---- Settings helpers ---------------------------------------------------

export async function getSetting(key: string): Promise<string | undefined> {
  return (await db.settings.get(key))?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

// ---- Backup / restore ---------------------------------------------------

export interface BackupFile {
  app: 'milk-tracer'
  version: 1
  exportedAt: number
  feeds: Feed[]
}

export async function exportData(now: number): Promise<BackupFile> {
  const feeds = await db.feeds.orderBy('timestamp').toArray()
  return { app: 'milk-tracer', version: 1, exportedAt: now, feeds }
}

export async function importData(
  file: BackupFile,
  mode: 'replace' | 'merge' = 'replace',
): Promise<number> {
  if (file?.app !== 'milk-tracer' || !Array.isArray(file.feeds)) {
    throw new Error('Invalid backup file')
  }
  return db.transaction('rw', db.feeds, async () => {
    if (mode === 'replace') await db.feeds.clear()
    const rows = file.feeds.map((f) => {
      const { id, ...rest } = f
      void id
      return rest
    })
    await db.feeds.bulkAdd(rows as Feed[])
    return rows.length
  })
}

export async function clearAllFeeds(): Promise<void> {
  await db.feeds.clear()
}
