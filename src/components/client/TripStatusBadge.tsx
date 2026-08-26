"use client"

import { useTranslations } from "next-intl"

const TRIP_STATUS_STYLE: Record<string, { color: string; bg: string }> = {
    pending: { color: 'var(--color-status-pending)', bg: 'var(--color-status-pending-bg)' },
    confirmed: { color: 'var(--color-trip-upcoming)', bg: 'var(--color-trip-upcoming-bg)' },
    assigned: { color: 'var(--color-status-assigned)', bg: 'var(--color-status-assigned-bg)' },
    in_progress: { color: 'var(--color-trip-inprogress)', bg: 'var(--color-trip-inprogress-bg)' },
    completed: { color: 'var(--color-trip-completed)', bg: 'var(--color-trip-completed-bg)' },
    cancelled: { color: 'var(--color-trip-cancelled)', bg: 'var(--color-trip-cancelled-bg)' },
}

const STATUS_KEY: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    assigned: 'assigned',
    in_progress: 'inProgress',
    completed: 'completed',
    cancelled: 'cancelled',
}

export function TripStatusBadge({ statut }: { statut: string }) {
    const t = useTranslations('client.statuses')
    const style = TRIP_STATUS_STYLE[statut] ?? { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
    const key = STATUS_KEY[statut]
    const label = key ? t(key) : statut

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0"
            style={{ backgroundColor: style.bg, color: style.color }}
        >
            {statut === 'in_progress' ? (
                <span className="live-badge w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: style.color }} />
            ) : (
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: style.color }} />
            )}
            {label}
        </span>
    )
}
