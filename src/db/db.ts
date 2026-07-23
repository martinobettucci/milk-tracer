import Dexie, { type Table } from 'dexie'
import type { BottleType, BreastSide, Fraction, MealKind } from '../lib/presets'
import { drunkMl } from '../lib/presets'

export interface Feed {
  id?: number
  timestamp: number // ms epoch — when the feed happened
  kind: MealKind // 'bottle' | 'breast'

  // --- bottle fields ---
  bottleType?: BottleType
  sizeMl?: number // prepared amount
  fraction?: Fraction // proportion drunk on the first serving
  drunkMl?: number // total drunk so far (includes any reclaimed leftover)
  wastedMl?: number // sizeMl - drunkMl (leftover; becomes permanent at expiry)

  // --- breast fields ---
  side?: BreastSide
  durationMin?: number // minutes, in 15-min slots
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
    // v1 — bottle-only feeds.
    this.version(1).stores({
      feeds: '++id, timestamp',
      settings: 'key',
    })
    // v2 — add feed kind (bottle/breast) + breast fields; backfill old rows.
    this.version(2)
      .stores({
        feeds: '++id, timestamp, kind',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx
          .table('feeds')
          .toCollection()
          .modify((f: Feed) => {
            if (!f.kind) f.kind = 'bottle'
          })
      })
  }
}

export const db = new MilkTracerDB()

// Expose the Dexie handle for e2e seeding (harmless for a local-only app).
if (typeof window !== 'undefined') {
  ;(window as unknown as { milkDb: MilkTracerDB }).milkDb = db
}

// ---- Bottle feeds -------------------------------------------------------

export async function addBottleFeed(input: {
  timestamp: number
  bottleType: BottleType
  sizeMl: number
  fraction: Fraction
}): Promise<number> {
  const drunk = drunkMl(input.sizeMl, input.fraction)
  return db.feeds.add({
    kind: 'bottle',
    timestamp: input.timestamp,
    bottleType: input.bottleType,
    sizeMl: input.sizeMl,
    fraction: input.fraction,
    drunkMl: drunk,
    wastedMl: input.sizeMl - drunk,
  })
}

export async function updateBottleFeed(
  id: number,
  patch: Partial<Pick<Feed, 'timestamp' | 'sizeMl' | 'fraction' | 'bottleType'>>,
): Promise<void> {
  const existing = await db.feeds.get(id)
  if (!existing || existing.kind !== 'bottle') return
  const sizeMl = patch.sizeMl ?? existing.sizeMl ?? 0
  const fraction = patch.fraction ?? existing.fraction ?? 1
  const drunk = drunkMl(sizeMl, fraction)
  await db.feeds.update(id, {
    ...patch,
    sizeMl,
    fraction,
    drunkMl: drunk,
    wastedMl: sizeMl - drunk,
  })
}

/**
 * Reclaim leftover milk from a bottle while it is still fresh: the baby drank
 * `addMl` more of the remaining. Counts as extra drunk and shrinks the waste.
 * Clamped to whatever is left (sizeMl - drunkMl).
 */
export async function reclaimMl(id: number, addMl: number): Promise<void> {
  const f = await db.feeds.get(id)
  if (!f || f.kind !== 'bottle') return
  const size = f.sizeMl ?? 0
  const drunk = f.drunkMl ?? 0
  const remaining = Math.max(0, size - drunk)
  const add = Math.max(0, Math.min(addMl, remaining))
  if (add === 0) return
  const newDrunk = drunk + add
  await db.feeds.update(id, { drunkMl: newDrunk, wastedMl: size - newDrunk })
}

// ---- Breast feeds -------------------------------------------------------

export async function addBreastFeed(input: {
  timestamp: number
  side: BreastSide
  durationMin: number
}): Promise<number> {
  return db.feeds.add({
    kind: 'breast',
    timestamp: input.timestamp,
    side: input.side,
    durationMin: input.durationMin,
  })
}

export async function updateBreastFeed(
  id: number,
  patch: Partial<Pick<Feed, 'timestamp' | 'side' | 'durationMin'>>,
): Promise<void> {
  const existing = await db.feeds.get(id)
  if (!existing || existing.kind !== 'breast') return
  await db.feeds.update(id, patch)
}

// ---- Shared -------------------------------------------------------------

export async function deleteFeed(id: number): Promise<void> {
  await db.feeds.delete(id)
}

export async function getSetting(key: string): Promise<string | undefined> {
  return (await db.settings.get(key))?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

// ---- Backup / restore ---------------------------------------------------

export interface BackupFile {
  app: 'milk-tracer'
  version: number
  exportedAt: number
  feeds: Feed[]
}

export async function exportData(now: number): Promise<BackupFile> {
  const feeds = await db.feeds.orderBy('timestamp').toArray()
  return { app: 'milk-tracer', version: 2, exportedAt: now, feeds }
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
      // Backfill kind for backups made before breast feeding existed.
      return { ...rest, kind: rest.kind ?? 'bottle' } as Feed
    })
    await db.feeds.bulkAdd(rows)
    return rows.length
  })
}

export async function clearAllFeeds(): Promise<void> {
  await db.feeds.clear()
}
