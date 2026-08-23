import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Warning, Info, X } from "@phosphor-icons/react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isClient) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={40} weight="regular" />,
          color: 'text-accent',
          border: 'border-accent',
          button: 'bg-accent hover:bg-accent-hover text-white',
          accent: 'bg-accent'
        }
      case 'error':
        return {
          icon: <XCircle size={40} weight="regular" />,
          color: 'text-[#B8493C]',
          border: 'border-[#B8493C]',
          button: 'bg-[#B8493C] hover:bg-[#9c3c31] text-white',
          accent: 'bg-[#B8493C]'
        }
      case 'warning':
        return {
          icon: <Warning size={40} weight="regular" />,
          color: 'text-[#B4643A]',
          border: 'border-[#B4643A]',
          button: 'bg-[#B4643A] hover:bg-[#96502D] text-white',
          accent: 'bg-[#B4643A]'
        }
      case 'info':
      default:
        return {
          icon: <Info size={40} weight="regular" />,
          color: 'text-accent',
          border: 'border-accent',
          button: 'bg-accent hover:bg-accent-hover text-white',
          accent: 'bg-accent'
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 font-archivo">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#12100E]/60"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md"
          >
            <div className={`relative bg-[#F7F3EC] border ${styles.border} rounded p-8`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[#6E6A63] hover:text-[#12100E] transition-colors"
                aria-label="Fermer"
              >
                <X size={20} weight="regular" />
              </button>

              {/* Header Icon Section */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className={`w-16 h-16 rounded-full border-2 ${styles.border} flex items-center justify-center ${styles.color} mb-5`}
                >
                  {styles.icon}
                </div>

                <h3 className="text-2xl font-bold text-[#12100E] tracking-tight mb-3">
                  {title}
                </h3>

                <div className={`h-0.5 w-10 ${styles.accent} mb-4`} />

                <p className="text-[#3d3a35] text-base leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleConfirm}
                  className={`w-full py-3.5 rounded text-sm font-semibold transition-colors ${styles.button}`}
                >
                  {confirmText}
                </button>

                {showCancel && (
                  <button
                    onClick={onClose}
                    className="w-full py-3.5 rounded text-[#6E6A63] text-sm font-medium hover:text-[#12100E] transition-colors"
                  >
                    {cancelText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


