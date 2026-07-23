import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CATALOGS, EU_LOCALES, type Locale, type StringKey } from './catalog'

const LS_KEY = 'milk-tracer-lang'

export function detectLocale(): Locale {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null
  if (stored && (EU_LOCALES as readonly string[]).includes(stored)) return stored as Locale
  const candidates =
    typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : ['en']
  for (const c of candidates) {
    const base = c.toLowerCase().split('-')[0]
    if ((EU_LOCALES as readonly string[]).includes(base)) return base as Locale
  }
  return 'en'
}

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale | 'auto') => void
  isAuto: boolean
  t: (key: StringKey) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [isAuto, setIsAuto] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    setIsAuto(!stored)
    setLocaleState(detectLocale())
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale | 'auto') => {
    if (l === 'auto') {
      localStorage.removeItem(LS_KEY)
      setIsAuto(true)
      setLocaleState(detectLocale())
    } else {
      localStorage.setItem(LS_KEY, l)
      setIsAuto(false)
      setLocaleState(l)
    }
  }, [])

  const t = useCallback(
    (key: StringKey): string => {
      const cat = CATALOGS[locale]
      return cat[key] ?? CATALOGS.en[key] ?? key
    },
    [locale],
  )

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, isAuto, t }), [locale, setLocale, isAuto, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
