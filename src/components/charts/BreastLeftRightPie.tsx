import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useI18n } from '../../i18n'
import type { BreastStats } from '../../lib/stats'
import { unit } from './format'
import ChartCard, { ChartEmpty } from './ChartCard'

const LEFT = '#f472b6' // warm pink
const RIGHT = '#f97350' // coral

export default function BreastLeftRightPie({ stats }: { stats: BreastStats }) {
  const { t } = useI18n()
  const data = [
    { name: t('br_left'), value: stats.leftMin, color: LEFT },
    { name: t('br_right'), value: stats.rightMin, color: RIGHT },
  ].filter((d) => d.value > 0)

  return (
    <ChartCard title={t('bs_leftRight')}>
      {data.length === 0 ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="52%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={unit(t('min'))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
