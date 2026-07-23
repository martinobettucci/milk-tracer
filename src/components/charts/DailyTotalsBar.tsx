import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../../i18n'
import type { DayTotals } from '../../lib/stats'
import { COLORS } from './palette'
import ChartCard, { ChartEmpty } from './ChartCard'

export default function DailyTotalsBar({ days }: { days: DayTotals[] }) {
  const { t } = useI18n()

  return (
    <ChartCard title={t('ch_daily')}>
      {days.length === 0 ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `${v} ${t('ml')}`} />
            <Legend />
            <Bar dataKey="drunk" name={t('drunk')} stackId="a" fill={COLORS.drunk} radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="wasted" name={t('wasted')} stackId="a" fill={COLORS.wasted} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
