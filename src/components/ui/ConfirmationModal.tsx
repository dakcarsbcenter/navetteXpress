"use client"

import { useEffect, useState } from "react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
  onConfirm?: () => void
  showCancel?: boolean
  cancelText?: string
}

export function ConfirmationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  confirmText = 'OK',
  onConfirm,
  showCancel = false,
  cancelText = 'Annuler'
}: ConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Délai pour l'animation d'entrée
      setTimeout(() => setIsVisible(true), 10)
    } else {
      document.body.style.overflow = 'unset'
      setIsVisible(false)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '🎉',
          iconBg: 'bg-gradient-to-br from-[#FFE8E8] to-[#FFD8D8] dark:from-[#A73B3C]/30 dark:to-[#8B3032]/30',
          iconColor: 'text-[#A73B3C] dark:text-[#FF9A9A]',
          buttonBg: 'bg-gradient-to-r from-[#A73B3C] to-[#8B3032] hover:from-[#8B3032] hover:to-[#6D2528] focus:ring-[#A73B3C]',
          borderColor: 'border-[#A73B3C]/30 dark:border-[#A73B3C]/50',
          ringColor: 'ring-[#A73B3C]/20'
        }
      case 'error':
        return {
          icon: '❌',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
      default:
        return {
          icon: '✅',
          iconBg: 'bg-[#FFE8E8] dark:bg-[#A73B3C]/20',
          iconColor: 'text-[#A73B3C] dark:text-[#FF9A9A]',
          buttonBg: 'bg-[#A73B3C] hover:bg-[#8B3032] focus:ring-[#A73B3C]',
          borderColor: 'border-[#A73B3C]/30 dark:border-[#A73B3C]/50'
        }
    }
  }

  const styles = getTypeStyles()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-all duration-300 ${
          isVisible ? 'bg-opacity-60' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative transform overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 w-full max-w-lg ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}>
          {/* Header with icon */}
          <div className={`px-8 pt-8 pb-6 border-b ${styles.borderColor}`}>
            <div className="flex items-center justify-center">
              <div className={`shrink-0 w-20 h-20 rounded-full ${styles.iconBg} flex items-center justify-center shadow-lg ring-4 ${styles.ringColor || 'ring-gray-500/20'} transition-all duration-300 hover:scale-110`}>
                <span className="text-3xl animate-bounce">{styles.icon}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {title}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-4 space-y-3 space-y-reverse sm:space-y-0">
              {showCancel && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 shadow-sm"
                >
                  {cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`w-full sm:w-auto px-8 py-3 text-sm font-bold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${styles.buttonBg}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


