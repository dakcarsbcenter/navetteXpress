"use client"

import { useEffect, useState, useRef } from "react"

interface SpectacularNotificationProps {
  isVisible: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
  showParticles?: boolean
  showConfetti?: boolean
}

export function SpectacularNotification({
  isVisible,
  title,
  message,
  type,
  duration = 5000,
  onClose,
  showParticles = true,
  showConfetti = false
}: SpectacularNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(100)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number }>>([])
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; life: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Créer des particules
      if (showParticles) {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1
        }))
        setParticles(newParticles)
      }

      // Créer des confettis pour les succès
      if (showConfetti && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        const newConfetti = Array.from({ length: 50 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: -10,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1
        }))
        setConfetti(newConfetti)
      }
      
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

      // Animation des particules
      const particleInterval = setInterval(() => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02
        })).filter(p => p.life > 0))

        setConfetti(prev => prev.map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          life: c.life - 0.01
        })).filter(c => c.life > 0))
      }, 50)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 500)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
        clearInterval(particleInterval)
      }
    }
  }, [isVisible, duration, onClose, type, showParticles, showConfetti])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
          icon: '🎉',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          border: 'border-emerald-300',
          shadow: 'shadow-emerald-500/30',
          glow: 'shadow-emerald-500/60'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600',
          icon: '💥',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-300',
          shadow: 'shadow-red-500/30',
          glow: 'shadow-red-500/60'
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600',
          icon: '⚡',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          border: 'border-amber-300',
          shadow: 'shadow-amber-500/30',
          glow: 'shadow-amber-500/60'
        }
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
          icon: '✨',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          border: 'border-cyan-300',
          shadow: 'shadow-cyan-500/30',
          glow: 'shadow-cyan-500/60'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-400 via-slate-500 to-zinc-600',
          icon: '💫',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          border: 'border-gray-300',
          shadow: 'shadow-gray-500/30',
          glow: 'shadow-gray-500/60'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        ref={containerRef}
        className={`
          ${styles.bg} text-white rounded-3xl shadow-2xl
          min-w-96 max-w-lg overflow-hidden border-2 ${styles.border}
          transform transition-all duration-700 ease-out
          ${isAnimating ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-full opacity-0 scale-95 rotate-12'}
          ${styles.shadow} ${styles.glow}
          relative
        `}
      >
        {/* Particules en arrière-plan */}
        {showParticles && particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/30 rounded-full pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.life,
              transform: `scale(${particle.life})`
            }}
          />
        ))}

        {/* Confettis */}
        {showConfetti && confetti.map(confetti => (
          <div
            key={confetti.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: `${confetti.x}%`,
              top: `${confetti.y}%`,
              backgroundColor: confetti.color,
              opacity: confetti.life,
              transform: `rotate(${confetti.x * 3.6}deg) scale(${confetti.life})`
            }}
          />
        ))}

        {/* Barre de progression avec effet de vague */}
        <div className="h-2 bg-white/20 relative overflow-hidden">
          <div
            className="h-full bg-white/80 transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/80 to-white/40 animate-pulse" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icône avec animation spectaculaire */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} 
              flex items-center justify-center
              ${isAnimating ? 'animate-bounce' : ''}
              relative overflow-hidden
            `}>
              <span className="text-2xl relative z-10">{styles.icon}</span>
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                {title}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed drop-shadow">
                {message}
              </p>
            </div>

            {/* Bouton de fermeture avec animation */}
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/70 hover:text-white transition-all duration-300 hover:scale-125 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Effet de brillance en arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        
        {/* Bordure animée */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/20 animate-pulse" />
      </div>
    </div>
  )
}
