interface DriverPillProps {
  label: string
}

const greenLabels = ["confirmée", "confirmé", "available", "disponible", "stable", "active", "actif", "terminé", "résolu", "resolved", "done"]
const goldLabels = ["en attente", "pending", "neutre", "in_progress", "in progress", "en cours", "open"]
const redLabels = ["annulée", "annulé", "cancelled", "indisponible", "urgent", "closed", "rejeté", "refused"]

export function DriverPill({ label }: DriverPillProps) {
  const normalized = label.toLowerCase()

  let className = "bg-[color-mix(in_srgb,var(--text-muted)_18%,transparent)] text-(--text-secondary)"

  if (greenLabels.some((item) => normalized.includes(item))) {
    className = "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-(--success)"
  } else if (goldLabels.some((item) => normalized.includes(item))) {
    className = "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-(--accent)"
  } else if (redLabels.some((item) => normalized.includes(item))) {
    className = "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-(--danger)"
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${className}`}>
      {label}
    </span>
  )
}
