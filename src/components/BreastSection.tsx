import { useI18n } from '../i18n'
import type { Feed } from '../db/db'
import { breastStats, breastDaily, formatMinutes, formatDuration } from '../lib/stats'
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={`${t('bs_today')}`} value={formatMinutes(s.todayMin)} accent="milk" icon="🤱" />
        <StatCard label={t('bs_avgFlow')} value={formatMinutes(s.avgDurationMin)} accent="milk" icon="📊" />
        <StatCard label={t('bs_total')} value={formatMinutes(s.totalMin)} accent="slate" icon="⏳" />
        <StatCard label={t('bs_avgFreq')} value={formatDuration(s.avgIntervalMs)} accent="slate" icon="⏱" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <BreastLeftRightPie stats={s} />
        <BreastDailyBar days={days} />
      </div>
    </section>
  )
}
