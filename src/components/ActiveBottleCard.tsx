import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { reclaimMl, type Feed } from '../db/db'
import { activeBottle, formatClock, formatDuration } from '../lib/stats'
import { fmtTime } from '../lib/format'

interface Props {
  feeds: Feed[]
  timerMin: number
}

export default function ActiveBottleCard({ feeds, timerMin }: Props) {
  const { t, locale } = useI18n()
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [give, setGive] = useState<number | null>(null)

  // Live 1s tick so the countdown and expiry update in real time.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const ab = activeBottle(feeds, nowTick, timerMin)
  if (!ab) return null

  const { feed, remainingMl, elapsedMs, totalMs, expired, msLeft } = ab
  const pct = Math.min(100, (elapsedMs / totalMs) * 100)
  const giveVal = give ?? remainingMl // default the slider to "all the rest"

  // color the progress by how much safe time is left
  const bar = expired ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'

  const doReclaim = async () => {
    if (feed.id && giveVal > 0) {
      await reclaimMl(feed.id, giveVal)
      setGive(null)
    }
  }

  return (
    <div className="card space-y-3" data-testid="active-bottle">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          ⏱ {t('ab_title')}
        </h3>
        <span className="text-xs text-stone-400">
          {feed.sizeMl} {t('ml')} · {fmtTime(feed.timestamp, locale)}
        </span>
      </div>

      {/* safety timer bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-medium">
          <span className={expired ? 'text-rose-500' : 'text-stone-500 dark:text-stone-300'}>
            {expired ? t('ab_expired') : `${t('ab_expiresIn')} ${formatClock(msLeft)}`}
          </span>
          <span className="text-stone-400">
            {formatDuration(elapsedMs)} / {timerMin}
            {t('min')}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* reclaim / remaining */}
      {remainingMl <= 0 ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          🎉 {t('ab_nothingLeft')}
        </p>
      ) : expired ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
          🚫 {t('ab_remaining')}: {remainingMl} {t('ml')} · {t('wasted')}
        </p>
      ) : (
        <div className="space-y-2 rounded-xl bg-milk-50 p-3 dark:bg-milk-900/20">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-600 dark:text-stone-200">{t('ab_drankRest')}</span>
            <span className="text-stone-400">
              {t('ab_remaining')}: {remainingMl} {t('ml')}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={remainingMl}
            step={5}
            value={giveVal}
            onChange={(e) => setGive(Number(e.target.value))}
            className="w-full accent-milk-500"
            data-testid="reclaim-slider"
          />
          <button
            className="btn-primary w-full"
            disabled={giveVal <= 0}
            onClick={doReclaim}
            data-testid="reclaim-give"
          >
            {t('ab_giveBack')} · {giveVal} {t('ml')}
          </button>
        </div>
      )}
    </div>
  )
}
