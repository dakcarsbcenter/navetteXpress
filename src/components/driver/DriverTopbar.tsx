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
        <header className="flex items-center justify-between px-6 lg:px-8 py-5 shrink-0 bg-white/80 dark:bg-[#05070A]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 sticky top-0 z-10">

            <div>
                <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">
                    Tableau de bord
                </h1>
                <div className="flex items-center gap-3 mt-1.5 font-mono">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">
                        {formatDate(currentDateTime)}
                    </p>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <p className="text-[10px] font-bold text-gray-900 dark:text-white">
                        {formatTime(currentDateTime)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifs */}
                <button
                    onClick={() => {/* logic notifs */ }}
                    className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 group">
                    <Bell size={20} weight="bold" className="group-hover:rotate-12 transition-transform" />
                    {notifCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/50" />
                    )}
                </button>
            </div>

        </header>

    )
}
