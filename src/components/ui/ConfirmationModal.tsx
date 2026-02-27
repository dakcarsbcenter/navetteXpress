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
          iconBg: 'bg-[#ffe4e1]',
          iconColor: 'text-gray-800',
          buttonBg: 'bg-[#943d3e] hover:bg-[#7a3233] focus:ring-[#943d3e]',
          borderColor: 'border-gray-200',
          ringColor: 'ring-[#ffe4e1]/50'
        }
      case 'error':
        return {
          icon: '❌',
          iconBg: 'bg-red-50',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          borderColor: 'border-red-100'
        }
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          borderColor: 'border-yellow-100'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          borderColor: 'border-blue-100'
        }
      default:
        return {
          icon: '✅',
          iconBg: 'bg-[#ffe4e1]',
          iconColor: 'text-gray-800',
          buttonBg: 'bg-[#943d3e] hover:bg-[#7a3233] focus:ring-[#943d3e]',
          borderColor: 'border-gray-200'
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
        className={`fixed inset-0 bg-black transition-all duration-300 ${isVisible ? 'bg-opacity-60' : 'bg-opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative transform overflow-hidden rounded-[2rem] bg-white shadow-lg transition-all duration-300 w-full max-w-lg ${isVisible
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
          }`}>
          {/* Header with icon */}
          <div className={`px-8 pt-10 pb-8 border-b ${styles.borderColor}`}>
            <div className="flex items-center justify-center">
              <div className={`shrink-0 w-24 h-24 rounded-full ${styles.iconBg} flex items-center justify-center ring-8 ${styles.ringColor || 'ring-gray-100'} transition-all duration-300`}>
                <span className="text-4xl">{styles.icon}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="text-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-[#1e293b]">
                {title}
              </h3>
              <p className="text-base sm:text-lg text-[#64748b] leading-relaxed max-w-sm mx-auto">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-10">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-4 space-y-3 space-y-reverse sm:space-y-0">
              {showCancel && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                >
                  {cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`w-full sm:w-auto px-10 py-3.5 text-sm font-bold text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${styles.buttonBg}`}
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


