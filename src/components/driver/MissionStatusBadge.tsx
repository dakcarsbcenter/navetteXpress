import React from 'react'

const MISSION_STATUS = {
    nouvelle: { label: 'Nouvelle', color: 'var(--color-mission-new)', bg: 'var(--color-mission-new-bg)' },
    acceptee: { label: 'Acceptée', color: 'var(--color-mission-accepted)', bg: 'var(--color-mission-accepted-bg)' },
    en_route: { label: 'En route', color: 'var(--color-mission-enroute)', bg: 'var(--color-mission-enroute-bg)' },
    en_cours: { label: 'En cours', color: 'var(--color-mission-inprogress)', bg: 'var(--color-mission-inprogress-bg)' },
    terminee: { label: 'Terminée', color: 'var(--color-mission-done)', bg: 'var(--color-mission-done-bg)' },
    pending: { label: 'En attente', color: 'var(--color-mission-new)', bg: 'var(--color-mission-new-bg)' },
    confirmed: { label: 'Confirmé', color: 'var(--color-mission-accepted)', bg: 'var(--color-mission-accepted-bg)' },
    assigned: { label: 'Assigné', color: 'var(--color-mission-accepted)', bg: 'var(--color-mission-accepted-bg)' },
    in_progress: { label: 'En cours', color: 'var(--color-mission-inprogress)', bg: 'var(--color-mission-inprogress-bg)' },
    completed: { label: 'Terminé', color: 'var(--color-mission-done)', bg: 'var(--color-mission-done-bg)' },
    cancelled: { label: 'Annulé', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

export function MissionStatusBadge({ statut }: { statut: string }) {
    const s = MISSION_STATUS[statut as keyof typeof MISSION_STATUS] ?? { label: statut, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0"
            style={{ backgroundColor: s.bg, color: s.color }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }} />
            {s.label}
        </span>
    );
}
