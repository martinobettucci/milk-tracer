import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../../i18n'
import type { Feed } from '../../db/db'
import { bottleFeeds } from '../../lib/stats'
import { COLORS } from './palette'
import ChartCard, { ChartEmpty } from './ChartCard'
import { fmtDateTime } from '../../lib/format'

export default function IntakeTimeSeriesLine({ feeds }: { feeds: Feed[] }) {
  const { t, locale } = useI18n()
  const data = bottleFeeds(feeds)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((f) => ({ ts: f.timestamp, drunk: f.drunkMl ?? 0 }))

  return (
    <ChartCard title={t('ch_intake')}>
      {data.length === 0 ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10 }}
              tickFormatter={(ts) =>
                new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).format(ts)
              }
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(ts) => fmtDateTime(Number(ts), locale)}
              formatter={(v: number) => `${v} ${t('ml')}`}
            />
            <Line
              type="monotone"
              dataKey="drunk"
              name={t('drunk')}
              stroke={COLORS.line}
              strokeWidth={2.5}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
