import type { ReactNode } from 'react'

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-stone-400">
      {label}
    </div>
  )
}

export default function ChartCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-stone-500 dark:text-stone-300">{title}</h3>
      <div className="h-56">{children}</div>
    </div>
  )
}
