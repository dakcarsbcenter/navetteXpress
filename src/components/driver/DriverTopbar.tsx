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
        <header className="flex items-center justify-between px-5 lg:px-6 py-4 shrink-0 bg-gray-50 dark:bg-driver-bg border-b border-gray-200 dark:border-white/5">

            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tableau de bord
                </h1>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-300" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatDate(currentDateTime)} — {formatTime(currentDateTime)}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Notifs — conserver handler existant (if any) */}
                <button
                    onClick={() => {/* logic notifs */ }}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-driver-card border border-gray-300 dark:border-driver-border text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <Bell size={16} weight="light" />
                    {notifCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-blue-600 dark:bg-driver-accent text-white">
                            {notifCount}
                        </span>
                    )}
                </button>
            </div>

        </header>
    )
}
