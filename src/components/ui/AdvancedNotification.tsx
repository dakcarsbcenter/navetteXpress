"use client"

import { useEffect, useState } from "react"

interface AdvancedNotificationProps {
  isVisible: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function AdvancedNotification({
  isVisible,
  title,
  message,
  type,
  duration = 4000,
  onClose,
  position = 'top-right'
}: AdvancedNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Animation de la barre de progression
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(progressInterval)
            return 0
          }
          return prev - (100 / (duration / 100))
        })
      }, 100)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
      }
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-linear-to-r from-green-500 to-green-600',
          icon: '✅',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          border: 'border-emerald-200',
          shadow: 'shadow-green-200/50'
        }
      case 'error':
        return {
          bg: 'bg-linear-to-r from-red-500 to-red-600',
          icon: '❌',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-200',
          shadow: 'shadow-red-200/50'
        }
      case 'warning':
        return {
          bg: 'bg-linear-to-r from-yellow-500 to-yellow-600',
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          border: 'border-yellow-200',
          shadow: 'shadow-yellow-200/50'
        }
      case 'info':
        return {
          bg: 'bg-linear-to-r from-blue-500 to-blue-600',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          border: 'border-blue-200',
          shadow: 'shadow-blue-200/50'
        }
      default:
        return {
          bg: 'bg-linear-to-r from-gray-500 to-gray-600',
          icon: 'ℹ️',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          border: 'border-gray-200',
          shadow: 'shadow-gray-200/50'
        }
    }
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  const styles = getTypeStyles()
  const positionStyles = getPositionStyles()

  return (
    <div className={`fixed ${positionStyles} z-50`}>
      <div
        className={`
          ${styles.bg} text-white rounded-xl shadow-2xl
          min-w-80 max-w-md overflow-hidden
          transform transition-all duration-300 ease-in-out
          ${isAnimating ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
          ${styles.shadow}
        `}
      >
        {/* Barre de progression */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white/40 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icône */}
            <div className={`shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <span className="text-sm">{styles.icon}</span>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white mb-1">
                {title}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={onClose}
              className="shrink-0 text-white/70 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


