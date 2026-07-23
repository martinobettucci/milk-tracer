export const fmtTime = (ts: number, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(ts)

export const fmtDateTime = (ts: number, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)

export const fmtNum = (n: number | null, locale: string, digits = 0): string =>
  n == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n)

/** Convert a ms epoch to the value a <input type="datetime-local"> expects. */
export function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v: string): number => new Date(v).getTime()
