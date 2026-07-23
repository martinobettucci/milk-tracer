import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../i18n'

// Hourly check for a freshly deployed version (installed/offline app included).
const CHECK_INTERVAL_MS = 60 * 60 * 1000

export default function ReloadPrompt() {
  const { t } = useI18n()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return
      const check = () => {
        if (navigator.onLine) r.update() // ask the server for a newer sw.js
      }
      setInterval(check, CHECK_INTERVAL_MS)
      window.addEventListener('online', check)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  if (!needRefresh) return null

  return (
    <div
      className="fixed inset-x-0 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-milk-200 bg-cream-50 px-4 py-3 shadow-soft dark:border-milk-800 dark:bg-cream-900"
      role="alert"
      data-testid="update-prompt"
    >
      <img src="/favicon-64.png" alt="" className="h-9 w-9 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-milk-700 dark:text-milk-300">{t('upd_title')}</p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">{t('upd_body')}</p>
      </div>
      <button
        className="btn-primary shrink-0 px-3 py-1.5 text-xs"
        onClick={() => updateServiceWorker(true)}
        data-testid="update-now"
      >
        {t('upd_cta')}
      </button>
      <button
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        onClick={() => setNeedRefresh(false)}
      >
        {t('upd_later')}
      </button>
    </div>
  )
}
