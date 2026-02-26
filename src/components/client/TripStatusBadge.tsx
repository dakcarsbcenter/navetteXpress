"use client"

const TRIP_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'En attente', color: 'var(--color-status-pending)', bg: 'var(--color-status-pending-bg)' },
    confirmed: { label: 'Confirmé', color: 'var(--color-trip-upcoming)', bg: 'var(--color-trip-upcoming-bg)' },
    assigned: { label: 'Assigné', color: 'var(--color-status-assigned)', bg: 'var(--color-status-assigned-bg)' },
    in_progress: { label: 'En cours', color: 'var(--color-trip-inprogress)', bg: 'var(--color-trip-inprogress-bg)' },
    completed: { label: 'Terminé', color: 'var(--color-trip-completed)', bg: 'var(--color-trip-completed-bg)' },
    cancelled: { label: 'Annulé', color: 'var(--color-trip-cancelled)', bg: 'var(--color-trip-cancelled-bg)' },
}

export function TripStatusBadge({ statut }: { statut: string }) {
    const s = TRIP_STATUS[statut] ?? { label: statut, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {statut === 'in_progress' ? (
                <span className="live-badge w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }} />
            ) : (
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }} />
            )}
            {s.label}
        </span>
    )
}
