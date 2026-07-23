import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useI18n } from '../../i18n'
import type { Feed } from '../../db/db'
import { totals } from '../../lib/stats'
import { COLORS } from './palette'
import ChartCard, { ChartEmpty } from './ChartCard'

export default function DrunkVsWastedPie({ feeds }: { feeds: Feed[] }) {
  const { t } = useI18n()
  const { drunk, wasted } = totals(feeds)
  const data = [
    { name: t('drunk'), value: drunk, color: COLORS.drunk },
    { name: t('wasted'), value: wasted, color: COLORS.wasted },
  ]
  const hasData = drunk + wasted > 0

  return (
    <ChartCard title={t('ch_drunkWasted')}>
      {!hasData ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v} ${t('ml')}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
