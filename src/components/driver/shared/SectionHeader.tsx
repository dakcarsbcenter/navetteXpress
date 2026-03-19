import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-heading text-[1.1rem] font-bold uppercase tracking-[0.15em] text-(--text-primary)">{title}</h1>
        {subtitle ? <p className="mt-1 text-[0.8rem] tracking-[0.05em] text-(--text-secondary)">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
