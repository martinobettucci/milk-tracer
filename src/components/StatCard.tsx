interface Props {
  label: string
  value: string
  unit?: string
  accent?: 'milk' | 'green' | 'amber' | 'slate'
  icon?: string
  note?: string // small secondary line, e.g. "293 ml est."
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  milk: 'text-milk-600 dark:text-milk-300',
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  slate: 'text-stone-700 dark:text-stone-200',
}

export default function StatCard({ label, value, unit, accent = 'slate', icon, note }: Props) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </div>
      <div className={`text-2xl font-extrabold tabular-nums ${ACCENTS[accent]}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-stone-400">{unit}</span>}
      </div>
      {note && <div className="text-xs font-medium text-stone-400">{note}</div>}
    </div>
  )
}
