import { useState } from 'react'
import { useI18n } from '../i18n'
import { addBottleFeed, addBreastFeed } from '../db/db'
import {
  BOTTLE_SIZES, FRACTIONS, drunkMl, BREAST_SIDES, BREAST_QUICK_SLOTS, BREAST_SLOT_MIN,
  BREAST_MAX_MIN, type BottleType, type BreastSide, type Fraction,
} from '../lib/presets'
import { toLocalInput, fromLocalInput } from '../lib/format'

type Choice = 'small' | 'big' | 'breast'
type Step = 'type' | 'size' | 'fraction' | 'side' | 'duration' | 'done'

interface Props {
  now: number
  breastMlPerMin: number
  onLogged?: () => void
}

export default function LogFeed({ now, breastMlPerMin, onLogged }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('type')
  const [choice, setChoice] = useState<Choice | null>(null)
  const [sizeMl, setSizeMl] = useState<number | null>(null)
  const [fraction, setFraction] = useState<Fraction | null>(null)
  const [side, setSide] = useState<BreastSide | null>(null)
  const [durationMin, setDurationMin] = useState<number>(BREAST_SLOT_MIN)
  const [when, setWhen] = useState<number>(now)

  const reset = () => {
    setStep('type')
    setChoice(null)
    setSizeMl(null)
    setFraction(null)
    setSide(null)
    setDurationMin(BREAST_SLOT_MIN)
    setWhen(Date.now())
  }

  const saveBottle = async () => {
    // fraction can be 0 (prepared but nothing drunk), so guard on null, not falsy.
    if (!choice || choice === 'breast' || !sizeMl || fraction === null) return
    await addBottleFeed({ timestamp: when, bottleType: choice, sizeMl, fraction })
    setStep('done')
    onLogged?.()
  }

  const saveBreast = async () => {
    if (!side) return
    await addBreastFeed({ timestamp: when, side, durationMin, mlPerMin: breastMlPerMin })
    setStep('done')
    onLogged?.()
  }

  const stepIndex =
    step === 'type' ? 0 : step === 'size' || step === 'side' ? 1 : step === 'done' ? 3 : 2

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
          <div className="grid grid-cols-3 gap-3">
            {(['small', 'big', 'breast'] as Choice[]).map((c) => (
              <button
                key={c}
                className="chip py-4"
                onClick={() => {
                  setChoice(c)
                  if (c === 'breast') setStep('side')
                  else {
                    setSizeMl(null)
                    setStep('size')
                  }
                }}
                data-testid={`type-${c}`}
              >
                <img
                  src={`/art/${c === 'breast' ? 'breast' : `bottle-${c}`}.webp`}
                  alt=""
                  className="h-16 w-auto object-contain drop-shadow-sm"
                />
                <span className="mt-2 text-sm">
                  {t(c === 'small' ? 'log_small' : c === 'big' ? 'log_big' : 'log_breast')}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- bottle: size ---- */}
      {step === 'size' && (choice === 'small' || choice === 'big') && (
        <section className="space-y-4" data-testid="step-size">
          <h2 className="text-center text-lg font-bold">{t('log_size')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {BOTTLE_SIZES[choice as BottleType].map((s) => (
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

      {/* ---- bottle: fraction ---- */}
      {step === 'fraction' && sizeMl && (
        <section className="space-y-4" data-testid="step-fraction">
          <h2 className="text-center text-lg font-bold">{t('log_fraction')}</h2>
          <p className="text-center text-sm text-stone-400">
            {t('log_size')}: {sizeMl} {t('ml')}
          </p>
          {/* empty → full scale, incl. 0/4 (prepared but nothing drunk) */}
          <div className="grid grid-cols-5 gap-2">
            {FRACTIONS.map((f) => (
              <button
                key={f.value}
                className={`chip px-1 py-3 ${fraction === f.value ? 'chip-active' : ''}`}
                onClick={() => setFraction(f.value)}
                data-testid={`fraction-${f.label.replace('/', '-')}`}
              >
                <FractionGlyph value={f.value} />
                <span className="mt-1.5 text-base">{f.label}</span>
                <span className="text-[10px] font-normal leading-tight text-stone-400">
                  {drunkMl(sizeMl, f.value)}
                </span>
              </button>
            ))}
          </div>

          <WhenField label={t('log_when')} when={when} setWhen={setWhen} />

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('size')}>
              ← {t('log_back')}
            </button>
            <button
              className="btn-primary flex-1"
              disabled={fraction === null}
              onClick={saveBottle}
              data-testid="save-feed"
            >
              {t('log_save')}
            </button>
          </div>
        </section>
      )}

      {/* ---- breast: side ---- */}
      {step === 'side' && (
        <section className="space-y-4" data-testid="step-side">
          <h2 className="text-center text-lg font-bold">{t('br_side')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {BREAST_SIDES.map((s) => (
              <button
                key={s}
                className="chip aspect-[3/2] text-xl"
                onClick={() => {
                  setSide(s)
                  setStep('duration')
                }}
                data-testid={`side-${s}`}
              >
                <span className="text-4xl">{s === 'left' ? '🫱' : '🫲'}</span>
                <span className="mt-1">{t(s === 'left' ? 'br_left' : 'br_right')}</span>
              </button>
            ))}
          </div>
          <button className="btn-ghost w-full" onClick={() => setStep('type')}>
            ← {t('log_back')}
          </button>
        </section>
      )}

      {/* ---- breast: duration ---- */}
      {step === 'duration' && side && (
        <section className="space-y-4" data-testid="step-duration">
          <h2 className="text-center text-lg font-bold">{t('br_duration')}</h2>
          <p className="text-center text-sm text-stone-400">
            {t(side === 'left' ? 'br_left' : 'br_right')}
          </p>

          <div className="grid grid-cols-4 gap-2">
            {BREAST_QUICK_SLOTS.map((m) => (
              <button
                key={m}
                className={`chip py-4 text-lg ${durationMin === m ? 'chip-active' : ''}`}
                onClick={() => setDurationMin(m)}
                data-testid={`slot-${m}`}
              >
                {m}
                <span className="text-xs font-normal text-stone-400">{t('min')}</span>
              </button>
            ))}
          </div>

          {/* fine stepper in 15-min slots */}
          <div className="flex items-center justify-center gap-4">
            <button
              className="btn-ghost h-11 w-11 !px-0 text-xl"
              onClick={() => setDurationMin((d) => Math.max(BREAST_SLOT_MIN, d - BREAST_SLOT_MIN))}
              aria-label="-15"
            >
              −
            </button>
            <div className="min-w-[6rem] text-center text-3xl font-extrabold tabular-nums text-milk-600 dark:text-milk-300">
              {durationMin}
              <span className="ml-1 text-base font-semibold text-stone-400">{t('min')}</span>
            </div>
            <button
              className="btn-ghost h-11 w-11 !px-0 text-xl"
              onClick={() => setDurationMin((d) => Math.min(BREAST_MAX_MIN, d + BREAST_SLOT_MIN))}
              aria-label="+15"
            >
              +
            </button>
          </div>

          <WhenField label={t('log_when')} when={when} setWhen={setWhen} />

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('side')}>
              ← {t('log_back')}
            </button>
            <button className="btn-primary flex-1" onClick={saveBreast} data-testid="save-breast">
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

function WhenField({
  label,
  when,
  setWhen,
}: {
  label: string
  when: number
  setWhen: (n: number) => void
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-stone-500">{label}</span>
      <input
        type="datetime-local"
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        value={toLocalInput(when)}
        onChange={(e) => setWhen(fromLocalInput(e.target.value))}
      />
    </label>
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
