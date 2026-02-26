import React from 'react';

// Mapping statuts → styles
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    en_attente: { label: 'En attente', color: 'var(--color-status-pending)', bg: 'var(--color-status-pending-bg)' },
    pending: { label: 'En attente', color: 'var(--color-status-pending)', bg: 'var(--color-status-pending-bg)' },
    assignee: { label: 'Assignée', color: 'var(--color-status-assigned)', bg: 'var(--color-status-assigned-bg)' },
    assigned: { label: 'Assignée', color: 'var(--color-status-assigned)', bg: 'var(--color-status-assigned-bg)' },
    confirmee: { label: 'Confirmée', color: 'var(--color-status-confirmed)', bg: 'var(--color-status-confirmed-bg)' },
    confirmed: { label: 'Confirmée', color: 'var(--color-status-confirmed)', bg: 'var(--color-status-confirmed-bg)' },
    en_cours: { label: 'En cours', color: 'var(--color-status-inprogress)', bg: 'var(--color-status-inprogress-bg)' },
    in_progress: { label: 'En cours', color: 'var(--color-status-inprogress)', bg: 'var(--color-status-inprogress-bg)' },
    terminee: { label: 'Terminée', color: 'var(--color-status-completed)', bg: 'var(--color-status-completed-bg)' },
    completed: { label: 'Terminée', color: 'var(--color-status-completed)', bg: 'var(--color-status-completed-bg)' },
    annulee: { label: 'Annulée', color: 'var(--color-status-cancelled)', bg: 'var(--color-status-cancelled-bg)' },
    cancelled: { label: 'Annulée', color: 'var(--color-status-cancelled)', bg: 'var(--color-status-cancelled-bg)' },
    sent: { label: 'Devis Envoyé', color: 'var(--color-status-sent)', bg: 'var(--color-status-sent-bg)' },
    accepted: { label: 'Accepté', color: 'var(--color-status-confirmed)', bg: 'var(--color-status-confirmed-bg)' },
    rejected: { label: 'Rejeté', color: 'var(--color-status-cancelled)', bg: 'var(--color-status-cancelled-bg)' },
    expired: { label: 'Expiré', color: 'var(--color-status-expired)', bg: 'var(--color-status-expired-bg)' },
};

export function StatusBadge({ statut }: { statut: string }) {
    const s = STATUS_MAP[statut.toLowerCase()] ?? { label: statut, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
            style={{ backgroundColor: s.bg, color: s.color }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }} />
            {s.label}
        </span>
    );
}
