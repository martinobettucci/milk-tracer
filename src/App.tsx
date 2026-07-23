import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, setSetting } from './db/db'
import { useI18n } from './i18n'
import { useTheme } from './lib/theme'
import { DEFAULT_TIMER_MIN } from './lib/presets'
import LogFeed from './components/LogFeed'
import Dashboard from './components/Dashboard'
import DataPanel from './components/DataPanel'
import Wizard from './components/Wizard'
import ReloadPrompt from './components/ReloadPrompt'

type Tab = 'log' | 'stats' | 'data'
const ONBOARDED_KEY = 'milk-tracer-onboarded'

export default function App() {
  const { t } = useI18n()
  const { pref, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('stats')
  const [now, setNow] = useState(() => Date.now())
  const [wizardOpen, setWizardOpen] = useState(false)
  // Bumped every time the user opens the Log tab so the form always starts
  // fresh — otherwise tapping "Log" while on the "saved" screen does nothing.
  const [logSession, setLogSession] = useState(0)

  const openTab = (k: Tab) => {
    if (k === 'log') setLogSession((s) => s + 1)
    setTab(k)
  }

  const feeds = useLiveQuery(() => db.feeds.toArray(), [], [])
  const timerSetting = useLiveQuery(() => db.settings.get('bottleTimerMin'), [])
  const timerMin = timerSetting?.value ? Number(timerSetting.value) : DEFAULT_TIMER_MIN
  const setTimerMin = (m: number) => setSetting('bottleTimerMin', String(m))

  // Keep "now" fresh so the recommendation clock stays sensible.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Show the onboarding wizard on first launch.
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDED_KEY)) setWizardOpen(true)
  }, [])

  const closeWizard = () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setWizardOpen(false)
  }

  const tabs: { key: Tab; icon: string }[] = [
    { key: 'log', icon: '/art/nav-log.webp' },
    { key: 'stats', icon: '/art/nav-stats.webp' },
    { key: 'data', icon: '/art/nav-data.webp' },
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
        {tab === 'log' && <LogFeed key={logSession} now={now} onLogged={() => undefined} />}
        {tab === 'stats' && (
          <Dashboard feeds={feeds ?? []} now={now} timerMin={timerMin} onGoLog={() => openTab('log')} />
        )}
        {tab === 'data' && (
          <DataPanel themePref={pref} setTheme={setTheme} timerMin={timerMin} setTimerMin={setTimerMin} now={now} />
        )}

        {/* Studio credit */}
        <footer className="mx-auto mt-8 max-w-3xl text-center text-xs text-stone-400">
          Made with <span className="text-rose-400">❤</span> and proudly with AI by{' '}
          <a
            href="https://p2enjoy.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-milk-600 hover:underline dark:text-milk-300"
          >
            P2Enjoy Studio
          </a>
        </footer>
      </main>

      {/* Bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-cream-200/70 bg-cream-50/90 backdrop-blur dark:border-white/5 dark:bg-cream-900/90">
        <div className="mx-auto flex max-w-3xl">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => openTab(tb.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold transition ${
                tab === tb.key
                  ? 'text-milk-600 dark:text-milk-300'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
              }`}
              data-testid={`nav-${tb.key}`}
            >
              <img
                src={tb.icon}
                alt=""
                className={`h-7 w-7 object-contain transition ${tab === tb.key ? '' : 'opacity-60 grayscale'}`}
              />
              {tabLabel(tb.key)}
            </button>
          ))}
          {/* Guide / onboarding — artwork icon, no emoji */}
          <button
            onClick={() => setWizardOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600 dark:hover:text-stone-200"
            data-testid="nav-guide"
          >
            <img src="/art/guide-icon.webp" alt="" className="h-7 w-7 object-contain opacity-60" />
            {t('wiz_guide')}
          </button>
        </div>
      </nav>

      {wizardOpen && <Wizard onClose={closeWizard} />}
      <ReloadPrompt />
    </div>
  )
}
