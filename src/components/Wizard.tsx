import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import type { StringKey } from '../i18n/catalog'

interface Slide {
  title: StringKey
  body: StringKey
  // Hero artwork (AI illustration). Used big on intro/outro, as a badge otherwise.
  art: string
  // Optional real in-app screenshot (or animated GIF) for a functionality slide.
  shot?: string
  // Render the shot in a fixed square frame (used for the animated stats tour).
  square?: boolean
}

const SLIDES: Slide[] = [
  { title: 'wiz1_t', body: 'wiz1_b', art: '/art/wiz-welcome.webp' },
  { title: 'wiz2_t', body: 'wiz2_b', art: '/art/bottle-small.webp', shot: '/wizard/shot-log.webp' },
  { title: 'wiz3_t', body: 'wiz3_b', art: '/art/breast.webp', shot: '/wizard/shot-breast.webp' },
  { title: 'wiz4_t', body: 'wiz4_b', art: '/art/bottle-big.webp', shot: '/wizard/shot-timer.webp' },
  { title: 'wiz5_t', body: 'wiz5_b', art: '/art/wiz-analytics.webp', shot: '/wizard/insights.gif', square: true },
  { title: 'wiz6_t', body: 'wiz6_b', art: '/art/wiz-offline.webp' },
]

export default function Wizard({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [i, setI] = useState(0)
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1
  const isHero = !slide.shot // intro/outro slides show the artwork large

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const next = () => (last ? onClose() : setI((n) => n + 1))
  const back = () => setI((n) => Math.max(0, n - 1))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      data-testid="wizard"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-soft dark:bg-cream-900 sm:rounded-3xl">
        {/* skip */}
        <div className="flex justify-end p-3 pb-0">
          <button
            className="rounded-lg px-3 py-1 text-sm font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            onClick={onClose}
            data-testid="wizard-skip"
          >
            {t('wiz_skip')}
          </button>
        </div>

        {/* visual */}
        <div className="flex flex-col items-center gap-3 px-6">
          {isHero ? (
            <img src={slide.art} alt="" className="h-44 w-44 object-contain drop-shadow" />
          ) : (
            <>
              <img
                src={slide.art}
                alt=""
                className="h-16 w-16 shrink-0 object-contain drop-shadow-sm"
              />
              <div className="w-full overflow-hidden rounded-2xl bg-cream-100 p-2 ring-1 ring-cream-200 dark:bg-cream-950 dark:ring-white/5">
                {slide.square ? (
                  <img
                    src={slide.shot}
                    alt=""
                    className="mx-auto aspect-square w-64 max-w-full rounded-xl object-cover"
                  />
                ) : (
                  <img
                    src={slide.shot}
                    alt=""
                    className="mx-auto max-h-64 w-full rounded-xl object-contain"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* text */}
        <div className="space-y-2 px-6 pt-4 text-center">
          <h2 className="text-xl font-extrabold text-milk-700 dark:text-milk-300">{t(slide.title)}</h2>
          <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-300">{t(slide.body)}</p>
        </div>

        {/* dots */}
        <div className="flex items-center justify-center gap-1.5 py-4" aria-hidden>
          {SLIDES.map((_, n) => (
            <span
              key={n}
              className={`h-2 rounded-full transition-all ${
                n === i ? 'w-6 bg-milk-500' : 'w-2 bg-stone-300 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>

        {/* nav */}
        <div className="safe-bottom flex gap-3 px-6 pb-5">
          {i > 0 && (
            <button className="btn-ghost flex-1" onClick={back}>
              {t('wiz_back')}
            </button>
          )}
          <button className="btn-primary flex-1" onClick={next} data-testid="wizard-next">
            {last ? t('wiz_done') : t('wiz_next')}
          </button>
        </div>
      </div>
    </div>
  )
}
