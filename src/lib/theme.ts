import { useEffect, useState } from 'react'

export type ThemePref = 'auto' | 'light' | 'dark'
const LS_KEY = 'milk-tracer-theme'

function apply(pref: ThemePref) {
  const dark =
    pref === 'dark' ||
    (pref === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>('auto')

  useEffect(() => {
    const stored = (localStorage.getItem(LS_KEY) as ThemePref | null) ?? 'auto'
    setPref(stored)
    apply(stored)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((localStorage.getItem(LS_KEY) as ThemePref | null ?? 'auto') === 'auto') apply('auto')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = (p: ThemePref) => {
    setPref(p)
    localStorage.setItem(LS_KEY, p)
    apply(p)
  }

  return { pref, setTheme }
}
