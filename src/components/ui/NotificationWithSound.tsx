"use client"

import { useEffect, useState } from "react"

interface NotificationWithSoundProps {
  isVisible: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
  playSound?: boolean
  vibrate?: boolean
}

export function NotificationWithSound({
  isVisible,
  title,
  message,
  type,
  duration = 4000,
  onClose,
  playSound = true,
  vibrate = true
}: NotificationWithSoundProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(100)
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      setIsPulsing(true)
      
      // Effet de vibration si supporté
      if (vibrate && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }

      // Effet sonore
      if (playSound) {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Fréquences différentes selon le type
        const frequencies = {
          success: [523, 659, 784], // Do, Mi, Sol
          error: [200, 150, 100],   // Fréquences graves
          warning: [440, 554],      // La, Do#
          info: [523, 659]          // Do, Mi
        }
        
        const freq = frequencies[type] || frequencies.info
        
        const playTone = (frequency: number, duration: number) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          
          osc.connect(gain)
          gain.connect(audioContext.destination)
          
          osc.frequency.setValueAtTime(frequency, audioContext.currentTime)
          gain.gain.setValueAtTime(0.1, audioContext.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
          
          osc.start(audioContext.currentTime)
          osc.stop(audioContext.currentTime + duration)
        }
        
        // Jouer la mélodie
        freq.forEach((f, index) => {
          setTimeout(() => playTone(f, 0.1), index * 150)
        })
      }
      
      // Arrêter l'effet de pulsation après 1 seconde
      setTimeout(() => setIsPulsing(false), 1000)
      
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
  }, [isVisible, duration, onClose, type, playSound, vibrate])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-linear-to-br from-green-400 via-green-500 to-green-600',
          icon: '✅',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          border: 'border-green-300',
          shadow: 'shadow-green-500/25',
          glow: 'shadow-green-500/50'
        }
      case 'error':
        return {
          bg: 'bg-linear-to-br from-red-400 via-red-500 to-red-600',
          icon: '❌',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-300',
          shadow: 'shadow-red-500/25',
          glow: 'shadow-red-500/50'
        }
      case 'warning':
        return {
          bg: 'bg-linear-to-br from-yellow-400 via-yellow-500 to-yellow-600',
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          border: 'border-yellow-300',
          shadow: 'shadow-yellow-500/25',
          glow: 'shadow-yellow-500/50'
        }
      case 'info':
        return {
          bg: 'bg-linear-to-br from-blue-400 via-blue-500 to-blue-600',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          border: 'border-blue-300',
          shadow: 'shadow-blue-500/25',
          glow: 'shadow-blue-500/50'
        }
      default:
        return {
          bg: 'bg-linear-to-br from-gray-400 via-gray-500 to-gray-600',
          icon: 'ℹ️',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          border: 'border-gray-300',
          shadow: 'shadow-gray-500/25',
          glow: 'shadow-gray-500/50'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          ${styles.bg} text-white rounded-2xl shadow-2xl
          min-w-80 max-w-md overflow-hidden border-2 ${styles.border}
          transform transition-all duration-500 ease-out
          ${isAnimating ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
          ${isPulsing ? 'animate-pulse' : ''}
          ${styles.shadow} ${isPulsing ? styles.glow : ''}
        `}
      >
        {/* Barre de progression avec effet de brillance */}
        <div className="h-1 bg-white/20 relative overflow-hidden">
          <div
            className="h-full bg-white/60 transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start space-x-4">
            {/* Icône avec animation */}
            <div className={`
              shrink-0 w-10 h-10 rounded-full ${styles.iconBg} 
              flex items-center justify-center
              ${isPulsing ? 'animate-bounce' : ''}
            `}>
              <span className="text-lg">{styles.icon}</span>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white mb-2">
                {title}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Bouton de fermeture avec animation */}
            <button
              onClick={onClose}
              className="shrink-0 text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Effet de brillance en arrière-plan */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      </div>
    </div>
  )
}


