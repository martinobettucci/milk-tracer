import { useState } from 'react'
import { useI18n } from '../i18n'
import { addFeed } from '../db/db'
import { BOTTLE_SIZES, FRACTIONS, drunkMl, type BottleType, type Fraction } from '../lib/presets'
import { toLocalInput, fromLocalInput } from '../lib/format'

type Step = 'type' | 'size' | 'fraction' | 'done'

interface Props {
  now: number
  onLogged?: () => void
}

export default function LogFeed({ now, onLogged }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('type')
  const [bottleType, setBottleType] = useState<BottleType | null>(null)
  const [sizeMl, setSizeMl] = useState<number | null>(null)
  const [fraction, setFraction] = useState<Fraction | null>(null)
  const [when, setWhen] = useState<number>(now)

  const reset = () => {
    setStep('type')
    setBottleType(null)
    setSizeMl(null)
    setFraction(null)
    setWhen(Date.now())
  }

  const save = async () => {
    if (!bottleType || !sizeMl || !fraction) return
    await addFeed({ timestamp: when, bottleType, sizeMl, fraction })
    setStep('done')
    onLogged?.()
  }

  const stepIndex = { type: 0, size: 1, fraction: 2, done: 3 }[step]

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* progress dots */}
      <div className="flex items-center justify-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i <= stepIndex ? 'w-8 bg-milk-500' : 'w-2 bg-stone-300 dark:bg-stone-700'
            }`}
          />
        ))}
      </div>

      {step === 'type' && (
        <section className="space-y-4" data-testid="step-type">
          <h2 className="text-center text-lg font-bold">{t('log_type')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['small', 'big'] as BottleType[]).map((bt) => (
              <button
                key={bt}
                className="chip aspect-square text-xl"
                onClick={() => {
                  setBottleType(bt)
                  setStep('size')
                }}
                data-testid={`type-${bt}`}
              >
                <img
                  src={`/art/bottle-${bt}.webp`}
                  alt=""
                  className={`${bt === 'small' ? 'h-20' : 'h-24'} w-auto object-contain drop-shadow-sm`}
                />
                <span className="mt-2">{t(bt === 'small' ? 'log_small' : 'log_big')}</span>
                <span className="mt-1 text-xs font-normal text-stone-400">
                  {BOTTLE_SIZES[bt][0]}–{BOTTLE_SIZES[bt][BOTTLE_SIZES[bt].length - 1]} {t('ml')}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'size' && bottleType && (
        <section className="space-y-4" data-testid="step-size">
          <h2 className="text-center text-lg font-bold">{t('log_size')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {BOTTLE_SIZES[bottleType].map((s) => (
              <button
                key={s}
                className="chip py-6 text-lg"
                onClick={() => {
                  setSizeMl(s)
                  setStep('fraction')
                }}
                data-testid={`size-${s}`}
              >
                {s}
                <span className="text-xs font-normal text-stone-400">{t('ml')}</span>
              </button>
            ))}
          </div>
          <button className="btn-ghost w-full" onClick={() => setStep('type')}>
            ← {t('log_back')}
          </button>
        </section>
      )}

      {step === 'fraction' && sizeMl && (
        <section className="space-y-4" data-testid="step-fraction">
          <h2 className="text-center text-lg font-bold">{t('log_fraction')}</h2>
          <p className="text-center text-sm text-stone-400">
            {t('log_size')}: {sizeMl} {t('ml')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FRACTIONS.map((f) => (
              <button
                key={f.value}
                className={`chip py-5 ${fraction === f.value ? 'chip-active' : ''}`}
                onClick={() => setFraction(f.value)}
                data-testid={`fraction-${f.label.replace('/', '-')}`}
              >
                <FractionGlyph value={f.value} />
                <span className="mt-2 text-lg">{f.label}</span>
                <span className="text-xs font-normal text-stone-400">
                  {drunkMl(sizeMl, f.value)} {t('ml')}
                </span>
              </button>
            ))}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-500">{t('log_when')}</span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              value={toLocalInput(when)}
              onChange={(e) => setWhen(fromLocalInput(e.target.value))}
            />
          </label>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('size')}>
              ← {t('log_back')}
            </button>
            <button
              className="btn-primary flex-1"
              disabled={!fraction}
              onClick={save}
              data-testid="save-feed"
            >
              {t('log_save')}
            </button>
          </div>
        </section>
      )}

      {step === 'done' && (
        <section className="card space-y-3 text-center" data-testid="step-done">
          <div className="text-5xl">✅</div>
          <h2 className="text-lg font-bold">{t('log_saved')}</h2>
          <button className="btn-primary w-full" onClick={reset}>
            {t('log_new')}
          </button>
        </section>
      )}
    </div>
  )
}

function FractionGlyph({ value }: { value: number }) {
  return (
    <span className="relative inline-block h-10 w-8 overflow-hidden rounded-md border-2 border-milk-400">
      <span
        className="absolute bottom-0 left-0 w-full bg-milk-400"
        style={{ height: `${value * 100}%` }}
      />
    </span>
  )
}
