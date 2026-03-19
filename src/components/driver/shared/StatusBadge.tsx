interface StatusBadgeProps {
  status: string
}

const greenStatuses = ["confirmée", "confirmé", "available", "disponible", "stable", "active", "actif", "terminé", "résolu", "resolved", "done"]
const goldStatuses = ["en attente", "pending", "neutre", "in_progress", "in progress", "en cours", "open"]
const redStatuses = ["annulée", "annulé", "cancelled", "indisponible", "urgent", "closed", "rejeté", "refused"]

export function DriverStatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase()

  let className = "bg-[color-mix(in_srgb,var(--text-muted)_18%,transparent)] text-(--text-secondary)"

  if (greenStatuses.some((item) => normalized.includes(item))) {
    className = "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-(--success)"
  } else if (goldStatuses.some((item) => normalized.includes(item))) {
    className = "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-(--accent)"
  } else if (redStatuses.some((item) => normalized.includes(item))) {
    className = "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-(--danger)"
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${className}`}>
      {status}
    </span>
  )
}
