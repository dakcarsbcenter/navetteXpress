"use client"

import { useState, useEffect } from 'react'
import { Bell } from '@phosphor-icons/react'
import { usePathname } from 'next/navigation'

const titleMap: Record<string, string> = {
    '/driver/dashboard': 'Tableau de bord',
    '/driver/planning': 'Planning',
    '/driver/disponibilites': 'Disponibilités',
    '/driver/rapport': 'Rapport Véhicule',
    '/driver/statistiques': 'Statistiques',
    '/driver/profil': 'Profil',
    '/driver/history': 'Historique',
}

export function DriverTopbar() {
    const pathname = usePathname()
    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    const [notifCount] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date())
        }, 60000)
        return () => clearInterval(timer)
    }, [])

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }
        return date.toLocaleDateString('fr-FR', options).toUpperCase()
    }

    const formatDateShort = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        }
        return date.toLocaleDateString('fr-FR', options).toUpperCase()
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-(--border) bg-(--bg-secondary)/90 px-3 py-3 backdrop-blur md:px-6 md:py-4">

            <div>
                <h1 className="text-xs font-black uppercase tracking-[0.15em] text-(--text-primary) sm:text-sm sm:tracking-[0.2em]">
                    {titleMap[pathname] ?? 'Tableau de bord'}
                </h1>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-(--text-muted) sm:text-[11px] sm:tracking-wider">
                    <p className="hidden sm:block">{formatDate(currentDateTime)}</p>
                    <p className="sm:hidden">{formatDateShort(currentDateTime)}</p>
                    <span>—</span>
                    <p>{formatTime(currentDateTime)}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={() => { }}
                    className="driver-dashboard-card group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) bg-(--bg-card) text-(--text-muted) hover:text-(--text-primary) sm:h-11 sm:w-11">
                    <Bell size={18} className="transition-transform group-hover:-rotate-12" />
                    {notifCount > 0 && (
                        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-(--accent)" />
                    )}
                </button>
            </div>

        </header>

    )
}
