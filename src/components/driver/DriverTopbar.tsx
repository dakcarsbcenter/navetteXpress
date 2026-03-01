"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Bell } from "@phosphor-icons/react"

export function DriverTopbar() {
    const { data: session } = useSession()
    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    const [notifCount, setNotifCount] = useState(0)

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
        return date.toLocaleDateString('fr-FR', options)
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <header className="flex items-center justify-between px-5 lg:px-6 py-4 shrink-0"
            style={{
                backgroundColor: 'var(--color-driver-bg)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>

            <div>
                <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                    Tableau de bord
                </h1>
                <p className="text-sm mt-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(currentDateTime)} — {formatTime(currentDateTime)}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Notifs — conserver handler existant (if any) */}
                <button
                    onClick={() => {/* logic notifs */ }}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                        backgroundColor: 'var(--color-driver-card)',
                        border: '1px solid var(--color-driver-border)',
                        color: 'var(--color-text-secondary)',
                    }}>
                    <Bell size={16} weight="light" />
                    {notifCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-driver-accent)', color: '#fff' }}>
                            {notifCount}
                        </span>
                    )}
                </button>
            </div>

        </header>
    )
}
