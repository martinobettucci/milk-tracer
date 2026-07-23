import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../../i18n'
import { unit } from './format'
import ChartCard, { ChartEmpty } from './ChartCard'

const PINK = '#ec4899'

export default function BreastDailyBar({
  days,
}: {
  days: { day: string; label: string; min: number }[]
}) {
  const { t } = useI18n()

  return (
    <ChartCard title={t('bs_daily')}>
      {days.length === 0 ? (
        <ChartEmpty label={t('ch_none')} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={unit(t('min'))} />
            <Bar dataKey="min" name={t('min')} fill={PINK} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
