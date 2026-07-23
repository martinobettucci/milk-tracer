import { useI18n } from '../i18n'
import type { Recommendation } from '../lib/stats'
import { formatDuration } from '../lib/stats'
import { fmtDateTime, fmtNum } from '../lib/format'

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { t, locale } = useI18n()

  return (
    <div className="card relative overflow-hidden bg-gradient-to-br from-milk-600 to-milk-800 text-white ring-0">
      <div className="pointer-events-none absolute -right-8 -top-8 text-[8rem] opacity-10">✨</div>
      <div className="relative space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-milk-100">
          ✨ {t('rec_title')}
        </h3>

        {!rec.hasData ? (
          <p className="text-milk-100">{t('rec_none')}</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <span className="text-milk-200">{t('rec_suggested')}</span>
              <span className="text-4xl font-extrabold tabular-nums">
                {fmtNum(rec.recommendedSize, locale)}
              </span>
              <span className="pb-1 font-semibold text-milk-200">{t('ml')}</span>
            </div>
            <p className="text-sm text-milk-100">{t('rec_hint')}</p>

            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              {rec.nextFeedAt && (
                <div>
                  <div className="text-milk-200">{t('rec_next')}</div>
                  <div className="font-semibold">{fmtDateTime(rec.nextFeedAt, locale)}</div>
                </div>
              )}
              {rec.avgIntervalMs != null && (
                <div>
                  <div className="text-milk-200">{t('avgFreq')}</div>
                  <div className="font-semibold">{formatDuration(rec.avgIntervalMs)}</div>
                </div>
              )}
              <div>
                <div className="text-milk-200">{t('rec_projWaste')}</div>
                <div className="font-semibold">
                  {fmtNum(rec.projectedWaste, locale)} {t('ml')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
