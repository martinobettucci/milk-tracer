import { useState } from 'react'
import { useI18n } from '../i18n'
import { deleteFeed, updateBottleFeed, updateBreastFeed, type Feed } from '../db/db'
import {
  BOTTLE_SIZES, FRACTIONS, BREAST_SIDES, BREAST_SLOT_MIN, BREAST_MAX_MIN,
  type BreastSide, type Fraction,
} from '../lib/presets'
import { fmtDateTime, toLocalInput, fromLocalInput } from '../lib/format'

export default function FeedTable({ feeds }: { feeds: Feed[] }) {
  const { t, locale } = useI18n()
  const [editing, setEditing] = useState<number | null>(null)
  const rows = [...feeds].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="card overflow-hidden p-0">
      <h3 className="border-b border-stone-100 px-4 py-3 text-sm font-semibold text-stone-500 dark:border-stone-800 dark:text-stone-300">
        {t('tbl_history')}
      </h3>
      <div className="max-h-[26rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-stone-50 text-left text-xs uppercase text-stone-400 dark:bg-stone-800/80">
            <tr>
              <th className="px-3 py-2 font-medium">{t('tbl_time')}</th>
              <th className="px-3 py-2 font-medium">{t('tbl_size')}</th>
              <th className="px-3 py-2 font-medium">{t('drunk')}</th>
              <th className="px-3 py-2 font-medium">{t('wasted')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('tbl_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) =>
              editing === f.id ? (
                f.kind === 'breast' ? (
                  <BreastEditRow key={f.id} feed={f} onDone={() => setEditing(null)} />
                ) : (
                  <BottleEditRow key={f.id} feed={f} onDone={() => setEditing(null)} />
                )
              ) : (
                <tr
                  key={f.id}
                  className="border-t border-stone-100 dark:border-stone-800"
                  data-testid="feed-row"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="mr-1">{f.kind === 'breast' ? '🤱' : '🍼'}</span>
                    {fmtDateTime(f.timestamp, locale)}
                  </td>
                  {f.kind === 'breast' ? (
                    <>
                      <td className="px-3 py-2">
                        {t(f.side === 'left' ? 'br_left' : 'br_right')}
                      </td>
                      <td className="px-3 py-2 font-semibold text-milk-600 tabular-nums dark:text-milk-300">
                        {f.durationMin} {t('min')}
                      </td>
                      <td className="px-3 py-2 text-stone-300 dark:text-stone-600">—</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 tabular-nums">
                        {f.sizeMl} {t('ml')}
                      </td>
                      <td className="px-3 py-2 font-semibold text-milk-600 tabular-nums dark:text-milk-300">
                        {f.drunkMl}
                      </td>
                      <td className="px-3 py-2 text-amber-600 tabular-nums dark:text-amber-400">
                        {f.wastedMl}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        className="rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                        onClick={() => setEditing(f.id!)}
                      >
                        {t('edit')}
                      </button>
                      <button
                        className="rounded-lg px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => f.id && deleteFeed(f.id)}
                        data-testid="delete-feed"
                      >
                        {t('del')}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const editInput =
  'w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-900'
const editSelect =
  'rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-900'

function BottleEditRow({ feed, onDone }: { feed: Feed; onDone: () => void }) {
  const { t } = useI18n()
  const [when, setWhen] = useState(feed.timestamp)
  const [sizeMl, setSizeMl] = useState(feed.sizeMl ?? 0)
  const [fraction, setFraction] = useState<Fraction>(feed.fraction ?? 1)
  const allSizes = [...new Set([...BOTTLE_SIZES.small, ...BOTTLE_SIZES.big])].sort((a, b) => a - b)

  const save = async () => {
    if (feed.id) await updateBottleFeed(feed.id, { timestamp: when, sizeMl, fraction })
    onDone()
  }

  return (
    <tr className="border-t border-milk-200 bg-milk-50/60 dark:border-milk-800 dark:bg-milk-900/20">
      <td className="px-3 py-2">
        <input type="datetime-local" className={editInput} value={toLocalInput(when)}
          onChange={(e) => setWhen(fromLocalInput(e.target.value))} />
      </td>
      <td className="px-3 py-2">
        <select className={editSelect} value={sizeMl} onChange={(e) => setSizeMl(Number(e.target.value))}>
          {allSizes.map((s) => (
            <option key={s} value={s}>{s} {t('ml')}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2" colSpan={2}>
        <select className={editSelect} value={fraction}
          onChange={(e) => setFraction(Number(e.target.value) as Fraction)}>
          {FRACTIONS.map((fr) => (
            <option key={fr.value} value={fr.value}>{fr.label}</option>
          ))}
        </select>
      </td>
      <EditActions onSave={save} onDone={onDone} />
    </tr>
  )
}

function BreastEditRow({ feed, onDone }: { feed: Feed; onDone: () => void }) {
  const { t } = useI18n()
  const [when, setWhen] = useState(feed.timestamp)
  const [side, setSide] = useState<BreastSide>(feed.side ?? 'left')
  const [durationMin, setDurationMin] = useState(feed.durationMin ?? BREAST_SLOT_MIN)
  const slots: number[] = []
  for (let m = BREAST_SLOT_MIN; m <= BREAST_MAX_MIN; m += BREAST_SLOT_MIN) slots.push(m)

  const save = async () => {
    if (feed.id) await updateBreastFeed(feed.id, { timestamp: when, side, durationMin })
    onDone()
  }

  return (
    <tr className="border-t border-milk-200 bg-milk-50/60 dark:border-milk-800 dark:bg-milk-900/20">
      <td className="px-3 py-2">
        <input type="datetime-local" className={editInput} value={toLocalInput(when)}
          onChange={(e) => setWhen(fromLocalInput(e.target.value))} />
      </td>
      <td className="px-3 py-2">
        <select className={editSelect} value={side} onChange={(e) => setSide(e.target.value as BreastSide)}>
          {BREAST_SIDES.map((s) => (
            <option key={s} value={s}>{t(s === 'left' ? 'br_left' : 'br_right')}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2" colSpan={2}>
        <select className={editSelect} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
          {slots.map((m) => (
            <option key={m} value={m}>{m} {t('min')}</option>
          ))}
        </select>
      </td>
      <EditActions onSave={save} onDone={onDone} />
    </tr>
  )
}

function EditActions({ onSave, onDone }: { onSave: () => void; onDone: () => void }) {
  const { t } = useI18n()
  return (
    <td className="px-3 py-2">
      <div className="flex justify-end gap-1">
        <button className="rounded-lg bg-milk-600 px-2 py-1 text-xs font-medium text-white" onClick={onSave}>
          {t('save')}
        </button>
        <button
          className="rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          onClick={onDone}
        >
          {t('cancel')}
        </button>
      </div>
    </td>
  )
}
