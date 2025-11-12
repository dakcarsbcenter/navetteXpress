'use client'

import { useEffect, useState } from 'react'

interface Driver {
  id: string
  firstName: string
  lastName: string
}

interface AvailabilityCheckProps {
  driverId: string | null
  scheduledDate: string | null
  onAvailabilityChange?: (isAvailable: boolean, message?: string) => void
}

export function DriverAvailabilityWarning({ 
  driverId, 
  scheduledDate,
  onAvailabilityChange 
}: AvailabilityCheckProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean
    message?: string
  } | null>(null)

  useEffect(() => {
    if (!driverId || !scheduledDate) {
      setAvailabilityStatus(null)
      onAvailabilityChange?.(true)
      return
    }

    checkAvailability()
  }, [driverId, scheduledDate])

  const checkAvailability = async () => {
    if (!driverId || !scheduledDate) return

    setIsChecking(true)
    
    try {
      const response = await fetch(
        `/api/driver/availability/check?driverId=${driverId}&scheduledDateTime=${scheduledDate}`
      )
      
      const data = await response.json()
      
      if (data.success) {
        setAvailabilityStatus({
          available: data.available,
          message: data.message
        })
        onAvailabilityChange?.(data.available, data.message)
      }
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error)
      setAvailabilityStatus(null)
      onAvailabilityChange?.(true) // En cas d'erreur, on autorise quand même
    } finally {
      setIsChecking(false)
    }
  }

  if (!driverId || !scheduledDate) return null
  
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Vérification de la disponibilité...
        </span>
      </div>
    )
  }

  if (!availabilityStatus) return null

  if (!availabilityStatus.available) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
            ⚠️ Chauffeur non disponible
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {availabilityStatus.message || "Le chauffeur n'a pas de disponibilité à la date choisie"}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Vous pouvez quand même assigner cette réservation, mais le chauffeur devra être contacté pour confirmer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
        ✓ Chauffeur disponible
      </span>
    </div>
  )
}
