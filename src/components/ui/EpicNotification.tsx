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
          icon: <CheckCircle size={32} weight="fill" className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />,
          wrapperBg: "from-emerald-950/40 to-obsidian/90",
          border: "border-emerald-500/30",
          progressBar: "bg-emerald-500",
          glow: "shadow-[0_8px_30px_rgba(52,211,153,0.15)]"
        }
      case 'error':
        return {
          icon: <XCircle size={32} weight="fill" className="text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]" />,
          wrapperBg: "from-red-950/40 to-obsidian/90",
          border: "border-red-500/30",
          progressBar: "bg-red-500",
          glow: "shadow-[0_8px_30px_rgba(248,113,113,0.15)]"
        }
      case 'warning':
        return {
          icon: <Warning size={32} weight="fill" className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />,
          wrapperBg: "from-amber-950/40 to-obsidian/90",
          border: "border-amber-500/30",
          progressBar: "bg-amber-500",
          glow: "shadow-[0_8px_30px_rgba(251,191,36,0.15)]"
        }
      case 'info':
      default:
        return {
          icon: <Info size={32} weight="fill" className="text-gold drop-shadow-[0_0_10px_rgba(201,168,76,0.5)]" />,
          wrapperBg: "from-gold-900/20 to-obsidian/90",
          border: "border-gold/30",
          progressBar: "bg-gold",
          glow: "shadow-[0_8px_30px_rgba(201,168,76,0.15)]"
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
          className="fixed top-6 right-6 z-[100] w-full max-w-sm"
        >
          <div className={`overflow-hidden rounded-2xl backdrop-blur-xl border ${styles.border} bg-gradient-to-br ${styles.wrapperBg} ${styles.glow}`}>
            <div className="p-5 flex items-start gap-4">
              <div className="shrink-0 animate-pulse-slow">
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">
                  {title}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            {/* Progress Bar */}
            <div className="h-1 w-full bg-black/40">
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


