import { startOfDay, format } from 'date-fns'
import type { Feed } from '../db/db'
import { ALL_SIZES, DEFAULT_BREAST_ML_PER_MIN } from './presets'

export interface DayTotals {
  day: string // yyyy-MM-dd
  label: string // localized short label
  prepared: number
  drunk: number
  wasted: number
  count: number
}

export interface Recommendation {
  hasData: boolean
  nextFeedAt: number | null // predicted timestamp of next feed
  avgIntervalMs: number | null
  recommendedSize: number | null // suggested prepared ml (a real bottle size)
  avgConsumed: number | null // rolling avg of recent drunk ml
  projectedWaste: number | null // waste if you prepare recommendedSize
  habitualWaste: number | null // avg waste per feed recently (for comparison)
}

export interface BreastStats {
  count: number
  totalMin: number
  avgDurationMin: number | null // "average flow": mean minutes per session
  todayMin: number
  todayCount: number
  avgIntervalMs: number | null
  leftCount: number
  rightCount: number
  leftMin: number
  rightMin: number
  totalEstMl: number // estimated intake, using each feed's frozen rate
  todayEstMl: number
}

/** Estimated ml drunk at a breast session, using its frozen rate. */
export function breastEstMl(feed: Feed): number {
  return Math.round((feed.durationMin ?? 0) * (feed.mlPerMin ?? DEFAULT_BREAST_ML_PER_MIN))
}

const DAY_MS = 24 * 60 * 60 * 1000

const sortByTime = (feeds: Feed[]): Feed[] =>
  [...feeds].sort((a, b) => a.timestamp - b.timestamp)

// ---- kind filters -------------------------------------------------------

export const bottleFeeds = (feeds: Feed[]): Feed[] => feeds.filter((f) => f.kind === 'bottle')
export const breastFeeds = (feeds: Feed[]): Feed[] => feeds.filter((f) => f.kind === 'breast')

// ---- bottle aggregation -------------------------------------------------

/** Group bottle feeds by calendar day. Returned oldest → newest. */
export function dailyTotals(feeds: Feed[], locale = 'en'): DayTotals[] {
  const map = new Map<string, DayTotals>()
  for (const f of bottleFeeds(feeds)) {
    const dayDate = startOfDay(f.timestamp)
    const day = format(dayDate, 'yyyy-MM-dd')
    let entry = map.get(day)
    if (!entry) {
      entry = {
        day,
        label: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(dayDate),
        prepared: 0,
        drunk: 0,
        wasted: 0,
        count: 0,
      }
      map.set(day, entry)
    }
    entry.prepared += f.sizeMl ?? 0
    entry.drunk += f.drunkMl ?? 0
    entry.wasted += f.wastedMl ?? 0
    entry.count += 1
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
}

/** Bottle totals for the current calendar day. */
export function todayTotals(feeds: Feed[], now: number): DayTotals {
  const today = format(startOfDay(now), 'yyyy-MM-dd')
  const all = dailyTotals(feeds)
  return (
    all.find((d) => d.day === today) ?? {
      day: today,
      label: 'today',
      prepared: 0,
      drunk: 0,
      wasted: 0,
      count: 0,
    }
  )
}

/** Mean interval (ms) between consecutive feeds (any kind) in the last window. */
export function avgIntervalMs(feeds: Feed[], now: number, windowDays = 7): number | null {
  const recent = sortByTime(feeds).filter((f) => f.timestamp >= now - windowDays * DAY_MS)
  if (recent.length < 2) return null
  let total = 0
  for (let i = 1; i < recent.length; i++) total += recent[i].timestamp - recent[i - 1].timestamp
  return total / (recent.length - 1)
}

/** Rolling average of drunk ml over the last `n` bottle feeds. */
export function avgConsumed(feeds: Feed[], n = 5): number | null {
  const sorted = sortByTime(bottleFeeds(feeds))
  if (sorted.length === 0) return null
  const slice = sorted.slice(-n)
  return slice.reduce((s, f) => s + (f.drunkMl ?? 0), 0) / slice.length
}

export function avgPerDrink(feeds: Feed[]): number | null {
  const bottles = bottleFeeds(feeds)
  if (bottles.length === 0) return null
  return bottles.reduce((s, f) => s + (f.drunkMl ?? 0), 0) / bottles.length
}

export function wastePercent(feeds: Feed[]): number {
  const bottles = bottleFeeds(feeds)
  const prepared = bottles.reduce((s, f) => s + (f.sizeMl ?? 0), 0)
  if (prepared === 0) return 0
  const wasted = bottles.reduce((s, f) => s + (f.wastedMl ?? 0), 0)
  return (wasted / prepared) * 100
}

export function totals(feeds: Feed[]): { prepared: number; drunk: number; wasted: number } {
  return bottleFeeds(feeds).reduce(
    (acc, f) => {
      acc.prepared += f.sizeMl ?? 0
      acc.drunk += f.drunkMl ?? 0
      acc.wasted += f.wastedMl ?? 0
      return acc
    },
    { prepared: 0, drunk: 0, wasted: 0 },
  )
}

/** Round a target volume UP to the nearest real, pourable bottle size. */
export function roundUpToSize(target: number): number {
  for (const s of ALL_SIZES) if (s >= target) return s
  return ALL_SIZES[ALL_SIZES.length - 1]
}

/**
 * Adaptive recommendation ("mini inline adapted ml"):
 * predict the next feed time and suggest a prepared volume that covers the
 * baby's recent appetite (+10% buffer) while cutting habitual over-pour.
 */
export function recommend(feeds: Feed[], now: number): Recommendation {
  const bottles = bottleFeeds(feeds)
  if (bottles.length === 0) {
    return {
      hasData: false,
      nextFeedAt: null,
      avgIntervalMs: null,
      recommendedSize: null,
      avgConsumed: null,
      projectedWaste: null,
      habitualWaste: null,
    }
  }
  const sorted = sortByTime(feeds) // next-feed time uses any feeding event
  const last = sorted[sorted.length - 1]
  const interval = avgIntervalMs(feeds, now)
  const consumed = avgConsumed(feeds) ?? bottles[bottles.length - 1].drunkMl ?? 0
  const target = consumed * 1.1
  const recommendedSize = roundUpToSize(target)
  const projectedWaste = Math.max(0, recommendedSize - consumed)
  const recentN = sortByTime(bottles).slice(-5)
  const habitualWaste = recentN.reduce((s, f) => s + (f.wastedMl ?? 0), 0) / recentN.length

  return {
    hasData: true,
    nextFeedAt: interval ? last.timestamp + interval : null,
    avgIntervalMs: interval,
    recommendedSize,
    avgConsumed: consumed,
    projectedWaste,
    habitualWaste,
  }
}

/** Bottle feeds bucketed by hour-of-day (0–23) — total drunk per hour. */
export function hourlyPattern(feeds: Feed[]): { hour: number; drunk: number; count: number }[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, drunk: 0, count: 0 }))
  for (const f of bottleFeeds(feeds)) {
    const h = new Date(f.timestamp).getHours()
    buckets[h].drunk += f.drunkMl ?? 0
    buckets[h].count += 1
  }
  return buckets
}

/** Distribution of bottle feeds by prepared size. */
export function sizeDistribution(feeds: Feed[]): { size: number; count: number }[] {
  const map = new Map<number, number>()
  for (const f of bottleFeeds(feeds)) {
    const s = f.sizeMl ?? 0
    map.set(s, (map.get(s) ?? 0) + 1)
  }
  return [...map.entries()].map(([size, count]) => ({ size, count })).sort((a, b) => a.size - b.size)
}

// ---- breast aggregation -------------------------------------------------

export function breastStats(feeds: Feed[], now: number): BreastStats {
  const bf = breastFeeds(feeds)
  const today = format(startOfDay(now), 'yyyy-MM-dd')
  let totalMin = 0
  let todayMin = 0
  let todayCount = 0
  let leftCount = 0
  let rightCount = 0
  let leftMin = 0
  let rightMin = 0
  let totalEstMl = 0
  let todayEstMl = 0
  for (const f of bf) {
    const min = f.durationMin ?? 0
    const est = breastEstMl(f)
    totalMin += min
    totalEstMl += est
    if (format(startOfDay(f.timestamp), 'yyyy-MM-dd') === today) {
      todayMin += min
      todayEstMl += est
      todayCount += 1
    }
    if (f.side === 'left') {
      leftCount += 1
      leftMin += min
    } else if (f.side === 'right') {
      rightCount += 1
      rightMin += min
    }
  }
  return {
    count: bf.length,
    totalMin,
    avgDurationMin: bf.length ? totalMin / bf.length : null,
    todayMin,
    todayCount,
    avgIntervalMs: avgIntervalMs(bf, now),
    leftCount,
    rightCount,
    leftMin,
    rightMin,
    totalEstMl,
    todayEstMl,
  }
}

/** Breast minutes per calendar day (oldest → newest). */
export function breastDaily(feeds: Feed[], locale = 'en'): { day: string; label: string; min: number }[] {
  const map = new Map<string, { day: string; label: string; min: number }>()
  for (const f of breastFeeds(feeds)) {
    const dayDate = startOfDay(f.timestamp)
    const day = format(dayDate, 'yyyy-MM-dd')
    let entry = map.get(day)
    if (!entry) {
      entry = {
        day,
        label: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(dayDate),
        min: 0,
      }
      map.set(day, entry)
    }
    entry.min += f.durationMin ?? 0
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
}

// ---- active bottle timer ------------------------------------------------

export interface ActiveBottle {
  feed: Feed
  remainingMl: number
  elapsedMs: number
  totalMs: number
  expired: boolean
  msLeft: number
}

/** The most recent bottle feed and its live safety-timer state, if any. */
export function activeBottle(feeds: Feed[], now: number, timerMin: number): ActiveBottle | null {
  const bottles = sortByTime(bottleFeeds(feeds))
  const last = bottles[bottles.length - 1]
  if (!last) return null
  const totalMs = timerMin * 60_000
  const elapsedMs = now - last.timestamp
  const remainingMl = Math.max(0, (last.sizeMl ?? 0) - (last.drunkMl ?? 0))
  return {
    feed: last,
    remainingMl,
    elapsedMs,
    totalMs,
    expired: elapsedMs >= totalMs,
    msLeft: Math.max(0, totalMs - elapsedMs),
  }
}

// ---- formatting ---------------------------------------------------------

export function formatDuration(ms: number | null): string {
  if (ms == null) return '—'
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

/** mm:ss countdown for the live timer. */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function formatMinutes(min: number | null): string {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
