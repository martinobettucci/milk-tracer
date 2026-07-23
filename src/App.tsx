import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { useI18n } from './i18n'
import { useTheme } from './lib/theme'
import LogFeed from './components/LogFeed'
import Dashboard from './components/Dashboard'
import DataPanel from './components/DataPanel'

type Tab = 'log' | 'stats' | 'data'

export default function App() {
  const { t } = useI18n()
  const { pref, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('stats')
  const [now, setNow] = useState(() => Date.now())

  const feeds = useLiveQuery(() => db.feeds.toArray(), [], [])

  // Keep "now" fresh so the recommendation clock stays sensible.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const tabs: { key: Tab; icon: string }[] = [
    { key: 'log', icon: '➕' },
    { key: 'stats', icon: '📈' },
    { key: 'data', icon: '⚙️' },
  ]
  const tabLabel = (k: Tab) => t(k === 'log' ? 'nav_log' : k === 'stats' ? 'nav_stats' : 'nav_data')

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-cream-200/70 bg-cream-100/80 backdrop-blur dark:border-white/5 dark:bg-cream-950/80">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3">
          <img src="/favicon-64.png" alt="" className="h-9 w-9 rounded-xl shadow-soft" />
          <div className="leading-tight">
            <h1 className="text-base font-extrabold text-milk-700 dark:text-milk-300">{t('appName')}</h1>
            <p className="text-[11px] text-stone-400">{t('tagline')}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-5">
        {tab === 'log' && <LogFeed now={now} onLogged={() => undefined} />}
        {tab === 'stats' && <Dashboard feeds={feeds ?? []} now={now} onGoLog={() => setTab('log')} />}
        {tab === 'data' && <DataPanel themePref={pref} setTheme={setTheme} now={now} />}
      </main>

      {/* Bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-cream-200/70 bg-cream-50/90 backdrop-blur dark:border-white/5 dark:bg-cream-900/90">
        <div className="mx-auto flex max-w-3xl">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition ${
                tab === tb.key
                  ? 'text-milk-600 dark:text-milk-300'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
              }`}
              data-testid={`nav-${tb.key}`}
            >
              <span className="text-lg">{tb.icon}</span>
              {tabLabel(tb.key)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
