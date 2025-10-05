"use client"

import { useEffect, useState } from "react"

interface ToastProps {
  isVisible: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ isVisible, message, type, duration = 3000, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // Attendre la fin de l'animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: '✅',
          text: 'text-white'
        }
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: '❌',
          text: 'text-white'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: '⚠️',
          text: 'text-white'
        }
      case 'info':
        return {
          bg: 'bg-blue-500',
          icon: 'ℹ️',
          text: 'text-white'
        }
      default:
        return {
          bg: 'bg-gray-500',
          icon: 'ℹ️',
          text: 'text-white'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          ${styles.bg} ${styles.text} px-6 py-3 rounded-lg shadow-lg
          flex items-center space-x-3 min-w-80 max-w-md
          transform transition-all duration-300 ease-in-out
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        <span className="text-lg">{styles.icon}</span>
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
