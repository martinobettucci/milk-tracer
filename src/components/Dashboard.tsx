import { useI18n } from '../i18n'
import type { Feed } from '../db/db'
import {
  dailyTotals, todayTotals, avgPerDrink, avgIntervalMs, wastePercent, totals, recommend,
  formatDuration, bottleFeeds,
} from '../lib/stats'
import { fmtNum } from '../lib/format'
import StatCard from './StatCard'
import RecommendationCard from './RecommendationCard'
import ActiveBottleCard from './ActiveBottleCard'
import BreastSection from './BreastSection'
import FeedTable from './FeedTable'
import DrunkVsWastedPie from './charts/DrunkVsWastedPie'
import SizeDistributionPie from './charts/SizeDistributionPie'
import DailyTotalsBar from './charts/DailyTotalsBar'
import HourlyPatternBar from './charts/HourlyPatternBar'
import IntakeTimeSeriesLine from './charts/IntakeTimeSeriesLine'

interface Props {
  feeds: Feed[]
  now: number
  timerMin: number
  onGoLog: () => void
}

export default function Dashboard({ feeds, now, timerMin, onGoLog }: Props) {
  const { t, locale } = useI18n()

  if (feeds.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
        <img src="/art/empty-hero.webp" alt="" className="h-52 w-52 object-contain drop-shadow" />
        <h2 className="text-xl font-bold">{t('empty_title')}</h2>
        <p className="text-stone-400">{t('empty_sub')}</p>
        <button className="btn-primary" onClick={onGoLog} data-testid="empty-cta">
          {t('empty_cta')}
        </button>
      </div>
    )
  }

  const hasBottle = bottleFeeds(feeds).length > 0
  const today = todayTotals(feeds, now)
  const days = dailyTotals(feeds, locale)
  const rec = recommend(feeds, now)
  const all = totals(feeds)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ActiveBottleCard feeds={feeds} timerMin={timerMin} />

      {hasBottle && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label={`${t('drunk')} · ${t('today')}`} value={fmtNum(today.drunk, locale)} unit={t('ml')} accent="milk" icon="🍼" />
            <StatCard label={`${t('wasted')} · ${t('today')}`} value={fmtNum(today.wasted, locale)} unit={t('ml')} accent="amber" icon="💧" />
            <StatCard label={`${t('feeds')} · ${t('today')}`} value={fmtNum(today.count, locale)} accent="slate" icon="📋" />
            <StatCard label={t('avgPerDrink')} value={fmtNum(avgPerDrink(feeds), locale)} unit={t('ml')} accent="milk" icon="📊" />
            <StatCard label={t('avgFreq')} value={formatDuration(avgIntervalMs(feeds, now))} accent="slate" icon="⏱" />
            <StatCard label={t('wastePct')} value={fmtNum(wastePercent(feeds), locale, 0)} unit="%" accent="amber" icon="♻️" />
          </div>

          <RecommendationCard rec={rec} />

          {/* Bottle charts */}
          <div className="grid gap-3 md:grid-cols-2">
            <DrunkVsWastedPie feeds={feeds} />
            <SizeDistributionPie feeds={feeds} />
            <DailyTotalsBar days={days} />
            <HourlyPatternBar feeds={feeds} />
            <div className="md:col-span-2">
              <IntakeTimeSeriesLine feeds={feeds} />
            </div>
          </div>

          {/* Grand totals */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label={t('prepared')} value={fmtNum(all.prepared, locale)} unit={t('ml')} accent="slate" />
            <StatCard label={t('totalDrunk')} value={fmtNum(all.drunk, locale)} unit={t('ml')} accent="green" />
            <StatCard label={t('wasted')} value={fmtNum(all.wasted, locale)} unit={t('ml')} accent="amber" />
          </div>
        </>
      )}

      <BreastSection feeds={feeds} now={now} />

      <FeedTable feeds={feeds} />
    </div>
  )
}
