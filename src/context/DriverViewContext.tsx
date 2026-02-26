"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type ViewType = 'home' | 'planning' | 'availability' | 'vehicle-report' | 'stats' | 'profile'

interface DriverViewContextType {
    currentView: ViewType
    setCurrentView: (view: ViewType) => void
    pendingBookingsCount: number
    setPendingBookingsCount: (count: number) => void
}

const DriverViewContext = createContext<DriverViewContextType | undefined>(undefined)

export function DriverViewProvider({ children }: { children: React.ReactNode }) {
    const [currentView, setCurrentView] = useState<ViewType>('home')
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0)

    // Optionnel: On pourrait déplacer ici le fetch du pending count si on veut qu'il soit global
    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const response = await fetch('/api/driver/bookings')
                if (response.ok) {
                    const data = await response.json()
                    if (data.success && Array.isArray(data.data)) {
                        const count = data.data.filter((item: any) =>
                            item.booking?.status === 'pending' || item.status === 'assigned'
                        ).length
                        setPendingBookingsCount(count)
                    }
                }
            } catch (error) {
                console.error('Error fetching pending count in context:', error)
            }
        }

        fetchPendingCount()
        // Rafraîchir toutes les 5 minutes
        const interval = setInterval(fetchPendingCount, 5 * 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <DriverViewContext.Provider value={{
            currentView,
            setCurrentView,
            pendingBookingsCount,
            setPendingBookingsCount
        }}>
            {children}
        </DriverViewContext.Provider>
    )
}

export function useDriverView() {
    const context = useContext(DriverViewContext)
    if (context === undefined) {
        throw new Error('useDriverView must be used within a DriverViewProvider')
    }
    return context
}
