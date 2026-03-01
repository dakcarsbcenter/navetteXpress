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
          icon: <CheckCircle size={56} weight="duotone" />,
          color: 'text-emerald-400',
          bg: 'from-emerald-500/20 to-emerald-500/5',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-500/20',
          button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
          accent: 'bg-emerald-500'
        }
      case 'error':
        return {
          icon: <XCircle size={56} weight="duotone" />,
          color: 'text-red-400',
          bg: 'from-red-500/20 to-red-500/5',
          border: 'border-red-500/30',
          glow: 'shadow-red-500/20',
          button: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30',
          accent: 'bg-red-500'
        }
      case 'warning':
        return {
          icon: <Warning size={56} weight="duotone" />,
          color: 'text-amber-400',
          bg: 'from-amber-500/20 to-amber-500/5',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/20',
          button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30',
          accent: 'bg-amber-500'
        }
      case 'info':
      default:
        return {
          icon: <Info size={56} weight="duotone" />,
          color: 'text-gold',
          bg: 'from-gold/20 to-gold/5',
          border: 'border-gold/30',
          glow: 'shadow-gold/20',
          button: 'bg-gold hover:bg-gold/90 text-midnight shadow-lg shadow-gold/30',
          accent: 'bg-gold'
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop avec flou progressif */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#09090B]/90 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20, rotateX: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            <div className={`relative bg-[#12121A] border ${styles.border} rounded-[2.5rem] shadow-2xl p-8 overflow-hidden`}>
              {/* Background Geometric Shapes */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 ${styles.accent} opacity-[0.03] blur-[80px] rounded-full`} />
              <div className={`absolute -bottom-24 -left-24 w-48 h-48 ${styles.accent} opacity-[0.03] blur-[80px] rounded-full`} />

              {/* Header Icon Section */}
              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <motion.div
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${styles.bg} border-2 ${styles.border} flex items-center justify-center ${styles.color} mb-6 shadow-2xl ${styles.glow}`}
                >
                  {styles.icon}
                </motion.div>

                <h3 className="text-3xl font-black text-white tracking-tight mb-3 font-display leading-tight">
                  {title}
                </h3>

                <div className={`h-1.5 w-12 ${styles.accent} rounded-full opacity-50 mb-4`} />

                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 relative z-10">
                <button
                  onClick={handleConfirm}
                  className={`w-full py-5 rounded-2xl text-base font-bold uppercase tracking-widest transition-all active:scale-[0.98] ${styles.button}`}
                >
                  {confirmText}
                </button>

                {showCancel && (
                  <button
                    onClick={onClose}
                    className="w-full py-5 rounded-2xl text-slate-500 text-base font-bold uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                  >
                    {cancelText}
                  </button>
                )}
              </div>

              {/* Decorative Corner */}
              <div className={`absolute top-0 right-0 p-4 opacity-10 ${styles.color}`}>
                <X size={120} weight="thin" className="translate-x-1/2 -translate-y-1/2 rotate-12" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


