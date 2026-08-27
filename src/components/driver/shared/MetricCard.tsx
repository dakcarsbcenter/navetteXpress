import { DriverPill } from "@/components/driver/shared/Pill"

type PhosphorIcon = React.ComponentType<{ size?: number; className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>

interface MetricCardProps {
  icon: PhosphorIcon
  label: string
  value: string | number
  badge?: string
  iconTone?: "gold" | "green" | "danger"
  delay?: number
}

export function MetricCard({ icon: Icon, label, value, badge, iconTone = "gold", delay = 0 }: MetricCardProps) {
  const toneClass = iconTone === "green"
    ? "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-(--success)"
    : iconTone === "danger"
      ? "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-(--danger)"
      : "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-(--accent)"

  return (
    <article className="driver-metric-card driver-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={18} />
        </div>
        {badge ? <DriverPill label={badge} /> : null}
      </div>
      <p className="text-[0.85rem] text-(--text-secondary)">{label}</p>
      <p className="mt-2 text-3xl font-bold text-(--text-primary)">{value}</p>
    </article>
  )
}
