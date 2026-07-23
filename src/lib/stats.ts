import { startOfDay, format } from 'date-fns'
import type { Feed } from '../db/db'
import { ALL_SIZES } from './presets'

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

const DAY_MS = 24 * 60 * 60 * 1000

const sortByTime = (feeds: Feed[]): Feed[] =>
  [...feeds].sort((a, b) => a.timestamp - b.timestamp)

/** Group feeds by calendar day. Returned oldest → newest. */
export function dailyTotals(feeds: Feed[], locale = 'en'): DayTotals[] {
  const map = new Map<string, DayTotals>()
  for (const f of feeds) {
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
    entry.prepared += f.sizeMl
    entry.drunk += f.drunkMl
    entry.wasted += f.wastedMl
    entry.count += 1
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
}

/** Totals for the current calendar day. */
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

/** Mean interval (ms) between consecutive feeds within the last `windowDays`. */
export function avgIntervalMs(feeds: Feed[], now: number, windowDays = 7): number | null {
  const recent = sortByTime(feeds).filter((f) => f.timestamp >= now - windowDays * DAY_MS)
  if (recent.length < 2) return null
  let total = 0
  for (let i = 1; i < recent.length; i++) total += recent[i].timestamp - recent[i - 1].timestamp
  return total / (recent.length - 1)
}

/** Rolling average of drunk ml over the last `n` feeds. */
export function avgConsumed(feeds: Feed[], n = 5): number | null {
  const sorted = sortByTime(feeds)
  if (sorted.length === 0) return null
  const slice = sorted.slice(-n)
  return slice.reduce((s, f) => s + f.drunkMl, 0) / slice.length
}

export function avgPerDrink(feeds: Feed[]): number | null {
  if (feeds.length === 0) return null
  return feeds.reduce((s, f) => s + f.drunkMl, 0) / feeds.length
}

export function wastePercent(feeds: Feed[]): number {
  const prepared = feeds.reduce((s, f) => s + f.sizeMl, 0)
  if (prepared === 0) return 0
  const wasted = feeds.reduce((s, f) => s + f.wastedMl, 0)
  return (wasted / prepared) * 100
}

export function totals(feeds: Feed[]): { prepared: number; drunk: number; wasted: number } {
  return feeds.reduce(
    (acc, f) => {
      acc.prepared += f.sizeMl
      acc.drunk += f.drunkMl
      acc.wasted += f.wastedMl
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
  if (feeds.length === 0) {
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
  const sorted = sortByTime(feeds)
  const last = sorted[sorted.length - 1]
  const interval = avgIntervalMs(feeds, now)
  const consumed = avgConsumed(feeds) ?? last.drunkMl
  const target = consumed * 1.1
  const recommendedSize = roundUpToSize(target)
  const projectedWaste = Math.max(0, recommendedSize - consumed)
  const recentN = sorted.slice(-5)
  const habitualWaste = recentN.reduce((s, f) => s + f.wastedMl, 0) / recentN.length

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

/** Feeds bucketed by hour-of-day (0–23) — total drunk per hour. */
export function hourlyPattern(feeds: Feed[]): { hour: number; drunk: number; count: number }[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, drunk: 0, count: 0 }))
  for (const f of feeds) {
    const h = new Date(f.timestamp).getHours()
    buckets[h].drunk += f.drunkMl
    buckets[h].count += 1
  }
  return buckets
}

/** Distribution of feeds by prepared bottle size. */
export function sizeDistribution(feeds: Feed[]): { size: number; count: number }[] {
  const map = new Map<number, number>()
  for (const f of feeds) map.set(f.sizeMl, (map.get(f.sizeMl) ?? 0) + 1)
  return [...map.entries()].map(([size, count]) => ({ size, count })).sort((a, b) => a.size - b.size)
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return '—'
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
