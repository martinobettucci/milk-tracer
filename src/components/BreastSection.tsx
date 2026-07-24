import { useI18n } from '../i18n'
import type { Feed } from '../db/db'
import { breastStats, breastDaily, formatMinutes, formatDuration } from '../lib/stats'
import { fmtNum } from '../lib/format'
import StatCard from './StatCard'
import BreastLeftRightPie from './charts/BreastLeftRightPie'
import BreastDailyBar from './charts/BreastDailyBar'

interface Props {
  feeds: Feed[]
  now: number
}

export default function BreastSection({ feeds, now }: Props) {
  const { t, locale } = useI18n()
  const s = breastStats(feeds, now)
  if (s.count === 0) return null

  const days = breastDaily(feeds, locale)

  return (
    <section className="space-y-3" data-testid="breast-section">
      <h2 className="flex items-center gap-2 px-1 text-base font-bold">
        <img src="/art/breast.webp" alt="" className="h-6 w-6 object-contain" />
        {t('bs_title')}
      </h2>

      {/* estimated intake (from time × frozen flow rate) */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={`${t('bs_estTitle')} · ${t('today')}`}
          value={`~${fmtNum(s.todayEstMl, locale)}`}
          unit={t('ml')}
          accent="milk"
          icon="🤱"
        />
        <StatCard
          label={`${t('bs_estTitle')} · ${t('bs_estTotal')}`}
          value={`~${fmtNum(s.totalEstMl, locale)}`}
          unit={t('ml')}
          accent="milk"
        />
      </div>
      <p className="px-1 text-xs text-stone-400">{t('bs_estNote')}</p>

      {/* time-based stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('bs_today')} value={formatMinutes(s.todayMin)} accent="slate" icon="⏳" />
        <StatCard label={t('bs_avgFlow')} value={formatMinutes(s.avgDurationMin)} accent="slate" icon="📊" />
        <StatCard label={t('bs_total')} value={formatMinutes(s.totalMin)} accent="slate" icon="Σ" />
        <StatCard label={t('bs_avgFreq')} value={formatDuration(s.avgIntervalMs)} accent="slate" icon="⏱" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <BreastLeftRightPie stats={s} />
        <BreastDailyBar days={days} />
      </div>
    </section>
  )
}
