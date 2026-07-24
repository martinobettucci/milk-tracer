// Bottle size presets, fraction options, breast-feeding options and the
// bottle safety-timer choices used when logging a feed.

export type BottleType = 'small' | 'big'
export type Fraction = 0 | 0.25 | 0.5 | 0.75 | 1
export type MealKind = 'bottle' | 'breast'
export type BreastSide = 'left' | 'right'

export const BOTTLE_SIZES: Record<BottleType, number[]> = {
  small: [30, 60, 90, 120, 150],
  big: [60, 120, 180, 240],
}

export const FRACTIONS: { value: Fraction; label: string }[] = [
  { value: 0, label: '0/4' }, // prepared but the baby drank nothing — it happens
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '2/4' },
  { value: 0.75, label: '3/4' },
  { value: 1, label: '4/4' },
]

// Every distinct ml value a bottle can be prepared at (used to round the
// adaptive recommendation up to a real, pourable size).
export const ALL_SIZES: number[] = Array.from(
  new Set([...BOTTLE_SIZES.small, ...BOTTLE_SIZES.big]),
).sort((a, b) => a - b)

export const drunkMl = (sizeMl: number, fraction: Fraction): number =>
  Math.round(sizeMl * fraction)

// Breast feeding is logged per side, in 15-minute slots.
export const BREAST_SIDES: BreastSide[] = ['left', 'right']
export const BREAST_SLOT_MIN = 15
export const BREAST_QUICK_SLOTS = [15, 30, 45, 60] // quick buttons; stepper extends
export const BREAST_MAX_MIN = 120

// Bottle "safe to drink" timer options (minutes since the feed).
export const TIMER_OPTIONS = [30, 60, 90, 120] as const
export type TimerMinutes = (typeof TIMER_OPTIONS)[number]
export const DEFAULT_TIMER_MIN: TimerMinutes = 60

// Breast-feeding intake estimate (ml per minute at the breast). You can't
// measure it directly; studies put a session (~12–67 min) at ~54–234 ml, i.e.
// roughly 3–6 ml/min on average. Each feed freezes the rate it was logged at.
export type BreastFlow = 'low' | 'medium' | 'high'
export const BREAST_FLOW_ML_PER_MIN: Record<BreastFlow, number> = {
  low: 3,
  medium: 4,
  high: 6,
}
export const BREAST_FLOW_OPTIONS: BreastFlow[] = ['low', 'medium', 'high']
export const DEFAULT_BREAST_FLOW: BreastFlow = 'medium'
export const DEFAULT_BREAST_ML_PER_MIN = BREAST_FLOW_ML_PER_MIN[DEFAULT_BREAST_FLOW]
export const flowMlPerMin = (f: BreastFlow): number => BREAST_FLOW_ML_PER_MIN[f]
