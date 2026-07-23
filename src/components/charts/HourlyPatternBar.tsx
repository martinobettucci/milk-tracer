import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../../i18n'
import type { Feed } from '../../db/db'
import { hourlyPattern } from '../../lib/stats'
import { COLORS } from './palette'
import { unit } from './format'
import ChartCard, { ChartEmpty } from './ChartCard'

export default function HourlyPatternBar({ feeds }: { feeds: Feed[] }) {
  const { t } = useI18n()
  const data = hourlyPattern(feeds).map((h) => ({
    hour: h.hour,
    label: `${h.hour}h`,
    drunk: h.drunk,
  }))
  const hasData = feeds.length > 0

  return (
    <ChartCard title={t('ch_hourly')}>
      {!hasData ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(h) => `${h}:00 – ${h}:59`}
              formatter={unit(t('ml'))}
            />
            <Bar dataKey="drunk" name={t('drunk')} fill={COLORS.line} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
