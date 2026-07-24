import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { EU_LOCALES, LOCALE_NAMES, type Locale } from '../i18n/catalog'
import { exportData, importData, clearAllFeeds, type BackupFile } from '../db/db'
import type { ThemePref } from '../lib/theme'
import { TIMER_OPTIONS, BREAST_FLOW_OPTIONS, BREAST_FLOW_ML_PER_MIN, type BreastFlow } from '../lib/presets'
import { ensurePersistentStorage, type PersistState } from '../lib/storage'

interface Props {
  themePref: ThemePref
  setTheme: (p: ThemePref) => void
  timerMin: number
  setTimerMin: (m: number) => void
  breastFlow: BreastFlow
  setBreastFlow: (f: BreastFlow) => void
  now: number
}

export default function DataPanel({
  themePref, setTheme, timerMin, setTimerMin, breastFlow, setBreastFlow, now,
}: Props) {
  const { t, locale, setLocale, isAuto } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [persist, setPersist] = useState<PersistState>('best-effort')

  useEffect(() => {
    ensurePersistentStorage().then(setPersist)
  }, [])

  const doExport = async () => {
    const data = await exportData(now)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `milk-tracer-backup.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile
      const n = await importData(parsed, 'replace')
      setMsg(`${n} ${t('data_imported')}`)
    } catch {
      setMsg('⚠︎ ' + t('data_import'))
    }
  }

  const themes: ThemePref[] = ['auto', 'light', 'dark']

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-bold">{t('data_title')}</h2>

      {/* Storage durability */}
      <div className="card space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              persist === 'persisted' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {t('stor_title')}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {persist === 'persisted' ? t('stor_ok') : t('stor_risk')}
        </p>
        <p className="text-xs text-stone-400">{t('stor_backup')}</p>
      </div>

      {/* Language */}
      <div className="card space-y-2">
        <label className="text-sm font-medium text-stone-500">{t('data_language')}</label>
        <select
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
          value={isAuto ? 'auto' : locale}
          onChange={(e) => setLocale(e.target.value === 'auto' ? 'auto' : (e.target.value as Locale))}
          data-testid="language-select"
        >
          <option value="auto">🌍 {t('th_auto')}</option>
          {EU_LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </div>

      {/* Bottle safety timer */}
      <div className="card space-y-2">
        <label className="text-sm font-medium text-stone-500">⏱ {t('data_timer')}</label>
        <div className="grid grid-cols-4 gap-2">
          {TIMER_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setTimerMin(m)}
              className={`chip py-3 text-sm ${timerMin === m ? 'chip-active' : ''}`}
              data-testid={`timer-${m}`}
            >
              {m}
              <span className="text-xs font-normal text-stone-400">{t('min')}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400">{t('data_timerHint')}</p>
      </div>

      {/* Breast intake estimate */}
      <div className="card space-y-2">
        <label className="text-sm font-medium text-stone-500">🤱 {t('data_flow')}</label>
        <div className="grid grid-cols-3 gap-2">
          {BREAST_FLOW_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setBreastFlow(f)}
              className={`chip py-3 text-sm ${breastFlow === f ? 'chip-active' : ''}`}
              data-testid={`flow-${f}`}
            >
              {t(f === 'low' ? 'flow_low' : f === 'medium' ? 'flow_medium' : 'flow_high')}
              <span className="text-xs font-normal text-stone-400">
                {BREAST_FLOW_ML_PER_MIN[f]} {t('perMin')}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400">{t('data_flowHint')}</p>
      </div>

      {/* Theme */}
      <div className="card space-y-2">
        <label className="text-sm font-medium text-stone-500">{t('data_theme')}</label>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((th) => (
            <button
              key={th}
              onClick={() => setTheme(th)}
              className={`chip py-3 text-sm ${themePref === th ? 'chip-active' : ''}`}
              data-testid={`theme-${th}`}
            >
              {th === 'auto' ? '🌗' : th === 'light' ? '☀️' : '🌙'}
              <span className="mt-1">{t(th === 'auto' ? 'th_auto' : th === 'light' ? 'th_light' : 'th_dark')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="card space-y-3">
        <p className="text-xs text-stone-400">{t('data_replaceNote')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={doExport}>
            ⬇︎ {t('data_export')}
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆︎ {t('data_import')}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
        />
        <button
          className="btn w-full bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
          onClick={async () => {
            if (confirm(t('data_confirmClear'))) await clearAllFeeds()
          }}
        >
          🗑 {t('data_clear')}
        </button>
        {msg && <p className="text-center text-sm font-medium text-milk-600 dark:text-milk-300">{msg}</p>}
      </div>
    </div>
  )
}
