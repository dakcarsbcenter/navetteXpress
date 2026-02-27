import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Warning, Info } from "@phosphor-icons/react"
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
          icon: <CheckCircle size={48} weight="fill" />,
          iconWrapper: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.15)]',
          buttonBg: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(52,211,153,0.2)]',
        }
      case 'error':
        return {
          icon: <XCircle size={48} weight="fill" />,
          iconWrapper: 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_30px_rgba(248,113,113,0.15)]',
          buttonBg: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(248,113,113,0.2)]',
        }
      case 'warning':
        return {
          icon: <Warning size={48} weight="fill" />,
          iconWrapper: 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.15)]',
          buttonBg: 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.2)]',
        }
      case 'info':
      default:
        return {
          icon: <Info size={48} weight="fill" />,
          iconWrapper: 'text-gold bg-gold/10 border-gold/20 shadow-[0_0_30px_rgba(201,168,76,0.15)]',
          buttonBg: 'bg-gold hover:bg-gold/90 text-midnight shadow-[0_0_20px_rgba(201,168,76,0.2)]',
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
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-obsidian border border-white/10 shadow-2xl"
            >
              {/* Header with Background Gradient Hint */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              <div className="px-8 pt-10 pb-6 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className={`shrink-0 w-24 h-24 rounded-full flex items-center justify-center border ${styles.iconWrapper}`}>
                    {styles.icon}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-3 text-white font-display">
                    {title}
                  </h3>
                  <p className="text-[15px] text-slate-300 leading-relaxed max-w-sm mx-auto">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 pb-8 pt-2 relative z-10">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
                  {showCancel && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-1/2 px-6 py-3.5 text-sm font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
                    >
                      {cancelText}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={`w-full ${showCancel ? 'sm:w-1/2' : 'sm:w-3/4'} px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 ${styles.buttonBg}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}


