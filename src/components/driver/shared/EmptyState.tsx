import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_55%,transparent)] p-6 text-center">
      <div className="text-(--text-muted)">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--text-secondary)">{title}</p>
      {description ? <p className="text-xs text-(--text-muted)">{description}</p> : null}
    </div>
  )
}
