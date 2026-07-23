import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useI18n } from '../../i18n'
import type { Feed } from '../../db/db'
import { sizeDistribution } from '../../lib/stats'
import { CATEGORICAL } from './palette'
import ChartCard, { ChartEmpty } from './ChartCard'

export default function SizeDistributionPie({ feeds }: { feeds: Feed[] }) {
  const { t } = useI18n()
  const dist = sizeDistribution(feeds)
  const data = dist.map((d) => ({ name: `${d.size} ${t('ml')}`, value: d.count }))

  return (
    <ChartCard title={t('ch_sizeDist')}>
      {data.length === 0 ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius="78%"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v} ${t('feeds')}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
