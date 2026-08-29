import { useEffect, useState, useRef } from "react"
import { CheckCircle, XCircle, Warning, Info, X } from "@phosphor-icons/react"
import { motion, AnimatePresence } from "framer-motion"

interface EpicNotificationProps {
  isVisible: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
  showParticles?: boolean
  showConfetti?: boolean
  showFireworks?: boolean
  showLightning?: boolean
  showRainbow?: boolean
  showHologram?: boolean
  showMeteors?: boolean
  showAurora?: boolean
}

export function EpicNotification({
  isVisible,
  title,
  message,
  type,
  duration = 5000,
  onClose,
}: EpicNotificationProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (isVisible) {
      // Setup progress bar timer
      setProgress(100)
      const intervalDelay = 50
      const deduction = (100 / (duration / intervalDelay))

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(progressInterval)
            return 0
          }
          return prev - deduction
        })
      }, intervalDelay)

      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
      }
    }
  }, [isVisible, duration, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={28} weight="fill" className="text-accent" />,
          border: "border-accent",
          iconBg: "bg-accent/10",
          progressBar: "bg-accent"
        }
      case 'error':
        return {
          icon: <XCircle size={28} weight="fill" className="text-[#B8493C]" />,
          border: "border-[#B8493C]",
          iconBg: "bg-[#B8493C]/10",
          progressBar: "bg-[#B8493C]"
        }
      case 'warning':
        return {
          icon: <Warning size={28} weight="fill" className="text-[#B4643A]" />,
          border: "border-[#B4643A]",
          iconBg: "bg-[#B4643A]/10",
          progressBar: "bg-[#B4643A]"
        }
      case 'info':
      default:
        return {
          icon: <Info size={28} weight="fill" className="text-accent" />,
          border: "border-accent",
          iconBg: "bg-accent/10",
          progressBar: "bg-accent"
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-6 right-6 z-120 w-full max-w-sm"
        >
          <div className={`overflow-hidden rounded-xl border ${styles.border} bg-[#F7F3EC] shadow-lg`}>
            <div className="p-4 flex items-start gap-3">
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-[#12100E] font-bold text-sm mb-0.5">
                  {title}
                </h4>
                <p className="text-[#3d3a35] text-sm leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg text-[#6E6A63] hover:text-[#12100E] hover:bg-black/5 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            {/* Progress Bar */}
            <div className="h-1 w-full bg-black/10">
              <motion.div
                className={`h-full ${styles.progressBar}`}
                style={{ width: `${progress}%` }}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


