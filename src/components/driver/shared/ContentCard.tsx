import type { ReactNode } from "react"

interface ContentCardProps {
  title?: string
  indicator?: "gold" | "green"
  right?: ReactNode
  children: ReactNode
  className?: string
}

export function ContentCard({ title, indicator, right, children, className = "" }: ContentCardProps) {
  return (
    <section className={`driver-content-card driver-fade-in-up ${className}`.trim()}>
      {(title || right) ? (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-(--border) pb-3">
          <div className="flex items-center gap-2">
            {title ? <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-(--text-primary)">{title}</h3> : null}
            {indicator ? (
              <span
                className={`inline-block h-2 w-2 rounded-full ${indicator === "green" ? "bg-(--success)" : "bg-(--accent)"}`}
              />
            ) : null}
          </div>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  )
}
