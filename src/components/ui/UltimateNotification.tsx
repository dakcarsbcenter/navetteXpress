"use client"

import { useEffect, useState, useRef } from "react"

interface UltimateNotificationProps {
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
}

export function UltimateNotification({
  isVisible,
  title,
  message,
  type,
  duration = 6000,
  onClose,
  showParticles = true,
  showConfetti = false,
  showFireworks = false,
  showLightning = false
}: UltimateNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(100)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }>>([])
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; life: number; rotation: number }>>([])
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }>>([])
  const [lightning, setLightning] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Créer des particules colorées
      if (showParticles) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd3a5']
        const newParticles = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          size: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        }))
        setParticles(newParticles)
      }

      // Créer des confettis pour les succès
      if (showConfetti && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd3a5']
        const newConfetti = Array.from({ length: 80 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: -10,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          rotation: Math.random() * 360
        }))
        setConfetti(newConfetti)
      }

      // Créer des feux d'artifice pour les succès
      if (showFireworks && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        const newFireworks = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2
        }))
        setFireworks(newFireworks)
      }

      // Créer des éclairs pour les erreurs
      if (showLightning && type === 'error') {
        const newLightning = Array.from({ length: 5 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.5 + 0.5
        }))
        setLightning(newLightning)
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

      // Animation des effets
      const effectInterval = setInterval(() => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.015
        })).filter(p => p.life > 0))

        setConfetti(prev => prev.map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          life: c.life - 0.008,
          rotation: c.rotation + 5
        })).filter(c => c.life > 0))

        setFireworks(prev => prev.map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          life: f.life - 0.01
        })).filter(f => f.life > 0))

        setLightning(prev => prev.map(l => ({
          ...l,
          life: l.life - 0.02,
          intensity: Math.random() * 0.5 + 0.5
        })).filter(l => l.life > 0))
      }, 50)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 700)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
        clearInterval(effectInterval)
      }
    }
  }, [isVisible, duration, onClose, type, showParticles, showConfetti, showFireworks, showLightning])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-linear-to-br from-emerald-400 via-green-500 to-teal-600',
          icon: '🎉',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          border: 'border-emerald-300',
          shadow: 'shadow-emerald-500/40',
          glow: 'shadow-emerald-500/70'
        }
      case 'error':
        return {
          bg: 'bg-linear-to-br from-red-400 via-rose-500 to-pink-600',
          icon: '💥',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-300',
          shadow: 'shadow-red-500/40',
          glow: 'shadow-red-500/70'
        }
      case 'warning':
        return {
          bg: 'bg-linear-to-br from-amber-400 via-yellow-500 to-orange-600',
          icon: '⚡',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          border: 'border-amber-300',
          shadow: 'shadow-amber-500/40',
          glow: 'shadow-amber-500/70'
        }
      case 'info':
        return {
          bg: 'bg-linear-to-br from-cyan-400 via-blue-500 to-indigo-600',
          icon: '✨',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          border: 'border-cyan-300',
          shadow: 'shadow-cyan-500/40',
          glow: 'shadow-cyan-500/70'
        }
      default:
        return {
          bg: 'bg-linear-to-br from-gray-400 via-slate-500 to-zinc-600',
          icon: '💫',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          border: 'border-gray-300',
          shadow: 'shadow-gray-500/40',
          glow: 'shadow-gray-500/70'
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
          transform transition-all duration-1000 ease-out
          ${isAnimating ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-full opacity-0 scale-95 rotate-12'}
          ${styles.shadow} ${styles.glow}
          relative
        `}
      >
        {/* Particules colorées */}
        {showParticles && particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full pointer-events-none animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: `scale(${particle.life}) rotate(${particle.x * 3.6}deg)`
            }}
          />
        ))}

        {/* Confettis animés */}
        {showConfetti && confetti.map(confetti => (
          <div
            key={confetti.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: `${confetti.x}%`,
              top: `${confetti.y}%`,
              backgroundColor: confetti.color,
              opacity: confetti.life,
              transform: `rotate(${confetti.rotation}deg) scale(${confetti.life})`
            }}
          />
        ))}

        {/* Feux d'artifice */}
        {showFireworks && fireworks.map(firework => (
          <div
            key={firework.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${firework.x}%`,
              top: `${firework.y}%`,
              width: `${firework.size}px`,
              height: `${firework.size}px`,
              backgroundColor: firework.color,
              opacity: firework.life,
              transform: `scale(${firework.life})`,
              boxShadow: `0 0 ${firework.size * 2}px ${firework.color}`
            }}
          />
        ))}

        {/* Éclairs */}
        {showLightning && lightning.map(lightning => (
          <div
            key={lightning.id}
            className="absolute pointer-events-none"
            style={{
              left: `${lightning.x}%`,
              top: `${lightning.y}%`,
              width: '2px',
              height: '20px',
              backgroundColor: '#ffffff',
              opacity: lightning.life * lightning.intensity,
              transform: `rotate(${Math.random() * 360}deg)`,
              boxShadow: '0 0 10px #ffffff'
            }}
          />
        ))}

        {/* Barre de progression avec effet de vague */}
        <div className="h-3 bg-white/20 relative overflow-hidden">
          <div
            className="h-full bg-white/90 transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-r from-white/40 via-white/90 to-white/40 animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent animate-pulse" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icône avec animation spectaculaire */}
            <div className={`
              shrink-0 w-14 h-14 rounded-full ${styles.iconBg} 
              flex items-center justify-center
              ${isAnimating ? 'animate-bounce' : ''}
              relative overflow-hidden
            `}>
              <span className="text-3xl relative z-10">{styles.icon}</span>
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
                {title}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed drop-shadow">
                {message}
              </p>
            </div>

            {/* Bouton de fermeture avec animation */}
            <button
              onClick={onClose}
              className="shrink-0 text-white/70 hover:text-white transition-all duration-300 hover:scale-125 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Effet de brillance en arrière-plan */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent animate-pulse" />
        
        {/* Bordure animée */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/30 animate-pulse" />
        
        {/* Effet de halo */}
        <div className="absolute inset-0 rounded-3xl bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}


