"use client"

import { useEffect, useState, useRef } from "react"

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
  duration = 10000,
  onClose,
  showParticles = true,
  showConfetti = false,
  showFireworks = false,
  showLightning = false,
  showRainbow = false,
  showHologram = false,
  showMeteors = false,
  showAurora = false
}: EpicNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(100)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; rotation: number; pulse: number }>>([])
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; life: number; rotation: number; shape: string; scale: number }>>([])
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; trail: Array<{ x: number; y: number; life: number }>; sparkles: Array<{ x: number; y: number; life: number; color: string }> }>>([])
  const [lightning, setLightning] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number; branches: Array<{ x: number; y: number; life: number }>; forks: Array<{ x: number; y: number; life: number }> }>>([])
  const [rainbow, setRainbow] = useState<Array<{ id: number; x: number; y: number; life: number; color: string; size: number; rotation: number }>>([])
  const [hologram, setHologram] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number; phase: number }>>([])
  const [meteors, setMeteors] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; trail: Array<{ x: number; y: number; life: number }> }>>([])
  const [aurora, setAurora] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number; color: string; wave: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Créer des particules colorées avec rotation et pulsation
      if (showParticles) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd3a5', '#dda0dd', '#98d8c8', '#ffb3ba', '#bae1ff']
        const newParticles = Array.from({ length: 80 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 1,
          size: Math.random() * 5 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          pulse: Math.random() * 2 + 0.5
        }))
        setParticles(newParticles)
      }

      // Créer des confettis avec formes différentes et échelle
      if (showConfetti && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd3a5']
        const shapes = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond']
        const newConfetti = Array.from({ length: 150 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: -10,
          vx: (Math.random() - 0.5) * 10,
          vy: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          rotation: Math.random() * 360,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          scale: Math.random() * 0.5 + 0.5
        }))
        setConfetti(newConfetti)
      }

      // Créer des feux d'artifice avec traînées et étincelles
      if (showFireworks && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        const newFireworks = Array.from({ length: 25 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          trail: Array.from({ length: 8 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          })),
          sparkles: Array.from({ length: 12 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)]
          }))
        }))
        setFireworks(newFireworks)
      }

      // Créer des éclairs avec branches et fourches
      if (showLightning && type === 'error') {
        const newLightning = Array.from({ length: 12 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.9 + 0.1,
          branches: Array.from({ length: 5 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          })),
          forks: Array.from({ length: 3 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          }))
        }))
        setLightning(newLightning)
      }

      // Créer un arc-en-ciel avec rotation
      if (showRainbow && type === 'success') {
        const rainbowColors = ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff80', '#00ffff', '#0080ff', '#8000ff']
        const newRainbow = Array.from({ length: 50 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          color: rainbowColors[i % rainbowColors.length],
          size: Math.random() * 4 + 1,
          rotation: Math.random() * 360
        }))
        setRainbow(newRainbow)
      }

      // Créer un effet holographique avec phase
      if (showHologram) {
        const newHologram = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.6 + 0.4,
          phase: Math.random() * Math.PI * 2
        }))
        setHologram(newHologram)
      }

      // Créer des météores
      if (showMeteors) {
        const colors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57']
        const newMeteors = Array.from({ length: 10 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          trail: Array.from({ length: 6 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          }))
        }))
        setMeteors(newMeteors)
      }

      // Créer une aurore boréale
      if (showAurora) {
        const auroraColors = ['#00ff88', '#00ffcc', '#00ccff', '#0088ff', '#4400ff']
        const newAurora = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.7 + 0.3,
          color: auroraColors[Math.floor(Math.random() * auroraColors.length)],
          wave: Math.random() * Math.PI * 2
        }))
        setAurora(newAurora)
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
          life: p.life - 0.008,
          rotation: p.rotation + 3,
          pulse: p.pulse + 0.1
        })).filter(p => p.life > 0))

        setConfetti(prev => prev.map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          life: c.life - 0.004,
          rotation: c.rotation + 10,
          scale: c.scale + 0.01
        })).filter(c => c.life > 0))

        setFireworks(prev => prev.map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          life: f.life - 0.006,
          trail: f.trail.map(t => ({
            ...t,
            life: t.life - 0.015
          })).filter(t => t.life > 0),
          sparkles: f.sparkles.map(s => ({
            ...s,
            life: s.life - 0.02
          })).filter(s => s.life > 0)
        })).filter(f => f.life > 0))

        setLightning(prev => prev.map(l => ({
          ...l,
          life: l.life - 0.012,
          intensity: Math.random() * 0.9 + 0.1,
          branches: l.branches.map(b => ({
            ...b,
            life: b.life - 0.025
          })).filter(b => b.life > 0),
          forks: l.forks.map(f => ({
            ...f,
            life: f.life - 0.03
          })).filter(f => f.life > 0)
        })).filter(l => l.life > 0))

        setRainbow(prev => prev.map(r => ({
          ...r,
          life: r.life - 0.008,
          rotation: r.rotation + 2
        })).filter(r => r.life > 0))

        setHologram(prev => prev.map(h => ({
          ...h,
          life: h.life - 0.015,
          intensity: Math.random() * 0.6 + 0.4,
          phase: h.phase + 0.1
        })).filter(h => h.life > 0))

        setMeteors(prev => prev.map(m => ({
          ...m,
          x: m.x + m.vx,
          y: m.y + m.vy,
          life: m.life - 0.01,
          trail: m.trail.map(t => ({
            ...t,
            life: t.life - 0.02
          })).filter(t => t.life > 0)
        })).filter(m => m.life > 0))

        setAurora(prev => prev.map(a => ({
          ...a,
          life: a.life - 0.01,
          intensity: Math.random() * 0.7 + 0.3,
          wave: a.wave + 0.05
        })).filter(a => a.life > 0))
      }, 50)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 1200)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
        clearInterval(effectInterval)
      }
    }
  }, [isVisible, duration, onClose, type, showParticles, showConfetti, showFireworks, showLightning, showRainbow, showHologram, showMeteors, showAurora])

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
          shadow: 'shadow-emerald-500/60',
          glow: 'shadow-emerald-500/90'
        }
      case 'error':
        return {
          bg: 'bg-linear-to-br from-red-400 via-rose-500 to-pink-600',
          icon: '💥',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-300',
          shadow: 'shadow-red-500/60',
          glow: 'shadow-red-500/90'
        }
      case 'warning':
        return {
          bg: 'bg-linear-to-br from-amber-400 via-yellow-500 to-orange-600',
          icon: '⚡',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          border: 'border-amber-300',
          shadow: 'shadow-amber-500/60',
          glow: 'shadow-amber-500/90'
        }
      case 'info':
        return {
          bg: 'bg-linear-to-br from-cyan-400 via-blue-500 to-indigo-600',
          icon: '✨',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          border: 'border-cyan-300',
          shadow: 'shadow-cyan-500/60',
          glow: 'shadow-cyan-500/90'
        }
      default:
        return {
          bg: 'bg-linear-to-br from-gray-400 via-slate-500 to-zinc-600',
          icon: '💫',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          border: 'border-gray-300',
          shadow: 'shadow-gray-500/60',
          glow: 'shadow-gray-500/90'
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
          transform transition-all duration-1500 ease-out
          ${isAnimating ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-full opacity-0 scale-95 rotate-12'}
          ${styles.shadow} ${styles.glow}
          relative
        `}
      >
        {/* Particules colorées avec rotation et pulsation */}
        {showParticles && particles.map(particle => (
          <div
            key={particle.id}
            className="absolute pointer-events-none animate-spin"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life * Math.sin(particle.pulse),
              transform: `scale(${particle.life}) rotate(${particle.rotation}deg)`,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
            }}
          />
        ))}

        {/* Confettis avec formes différentes et échelle */}
        {showConfetti && confetti.map(confetti => (
          <div
            key={confetti.id}
            className="absolute pointer-events-none"
            style={{
              left: `${confetti.x}%`,
              top: `${confetti.y}%`,
              width: '10px',
              height: '10px',
              backgroundColor: confetti.color,
              opacity: confetti.life,
              transform: `rotate(${confetti.rotation}deg) scale(${confetti.life * confetti.scale})`,
              borderRadius: confetti.shape === 'circle' ? '50%' : confetti.shape === 'square' ? '0%' : confetti.shape === 'triangle' ? '0%' : '50%',
              clipPath: confetti.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : confetti.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : confetti.shape === 'heart' ? 'polygon(50% 85%, 15% 50%, 15% 25%, 50% 25%, 85% 25%, 85% 50%)' : confetti.shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'none'
            }}
          />
        ))}

        {/* Feux d'artifice avec traînées et étincelles */}
        {showFireworks && fireworks.map(firework => (
          <div key={firework.id}>
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${firework.x}%`,
                top: `${firework.y}%`,
                width: `${firework.size}px`,
                height: `${firework.size}px`,
                backgroundColor: firework.color,
                opacity: firework.life,
                transform: `scale(${firework.life})`,
                boxShadow: `0 0 ${firework.size * 4}px ${firework.color}`
              }}
            />
            {firework.trail.map((trail, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${trail.x}%`,
                  top: `${trail.y}%`,
                  width: `${firework.size * 0.6}px`,
                  height: `${firework.size * 0.6}px`,
                  backgroundColor: firework.color,
                  opacity: trail.life * firework.life,
                  transform: `scale(${trail.life})`
                }}
              />
            ))}
            {firework.sparkles.map((sparkle, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${sparkle.x}%`,
                  top: `${sparkle.y}%`,
                  width: '2px',
                  height: '2px',
                  backgroundColor: sparkle.color,
                  opacity: sparkle.life * firework.life,
                  transform: `scale(${sparkle.life})`,
                  boxShadow: `0 0 4px ${sparkle.color}`
                }}
              />
            ))}
          </div>
        ))}

        {/* Éclairs avec branches et fourches */}
        {showLightning && lightning.map(lightning => (
          <div key={lightning.id}>
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${lightning.x}%`,
                top: `${lightning.y}%`,
                width: '4px',
                height: '40px',
                backgroundColor: '#ffffff',
                opacity: lightning.life * lightning.intensity,
                transform: `rotate(${Math.random() * 360}deg)`,
                boxShadow: '0 0 20px #ffffff'
              }}
            />
            {lightning.branches.map((branch, index) => (
              <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: `${branch.x}%`,
                  top: `${branch.y}%`,
                  width: '3px',
                  height: '20px',
                  backgroundColor: '#ffffff',
                  opacity: branch.life * lightning.life,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  boxShadow: '0 0 15px #ffffff'
                }}
              />
            ))}
            {lightning.forks.map((fork, index) => (
              <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: `${fork.x}%`,
                  top: `${fork.y}%`,
                  width: '2px',
                  height: '15px',
                  backgroundColor: '#ffffff',
                  opacity: fork.life * lightning.life,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  boxShadow: '0 0 10px #ffffff'
                }}
              />
            ))}
          </div>
        ))}

        {/* Arc-en-ciel avec rotation */}
        {showRainbow && rainbow.map(rainbow => (
          <div
            key={rainbow.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${rainbow.x}%`,
              top: `${rainbow.y}%`,
              width: `${rainbow.size}px`,
              height: `${rainbow.size}px`,
              backgroundColor: rainbow.color,
              opacity: rainbow.life,
              transform: `scale(${rainbow.life}) rotate(${rainbow.rotation}deg)`,
              boxShadow: `0 0 ${rainbow.size * 3}px ${rainbow.color}`
            }}
          />
        ))}

        {/* Effet holographique avec phase */}
        {showHologram && hologram.map(hologram => (
          <div
            key={hologram.id}
            className="absolute pointer-events-none"
            style={{
              left: `${hologram.x}%`,
              top: `${hologram.y}%`,
              width: '25px',
              height: '25px',
              backgroundColor: '#ffffff',
              opacity: hologram.life * hologram.intensity * Math.sin(hologram.phase) * 0.4,
              transform: `scale(${hologram.life}) rotate(${hologram.x * 3.6}deg)`,
              boxShadow: '0 0 25px #ffffff',
              borderRadius: '50%'
            }}
          />
        ))}

        {/* Météores */}
        {showMeteors && meteors.map(meteor => (
          <div key={meteor.id}>
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${meteor.x}%`,
                top: `${meteor.y}%`,
                width: `${meteor.size}px`,
                height: `${meteor.size}px`,
                backgroundColor: meteor.color,
                opacity: meteor.life,
                transform: `scale(${meteor.life})`,
                boxShadow: `0 0 ${meteor.size * 2}px ${meteor.color}`
              }}
            />
            {meteor.trail.map((trail, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${trail.x}%`,
                  top: `${trail.y}%`,
                  width: `${meteor.size * 0.5}px`,
                  height: `${meteor.size * 0.5}px`,
                  backgroundColor: meteor.color,
                  opacity: trail.life * meteor.life,
                  transform: `scale(${trail.life})`
                }}
              />
            ))}
          </div>
        ))}

        {/* Aurore boréale */}
        {showAurora && aurora.map(aurora => (
          <div
            key={aurora.id}
            className="absolute pointer-events-none"
            style={{
              left: `${aurora.x}%`,
              top: `${aurora.y}%`,
              width: '30px',
              height: '30px',
              backgroundColor: aurora.color,
              opacity: aurora.life * aurora.intensity * Math.sin(aurora.wave) * 0.6,
              transform: `scale(${aurora.life}) rotate(${aurora.x * 3.6}deg)`,
              boxShadow: `0 0 30px ${aurora.color}`,
              borderRadius: '50%'
            }}
          />
        ))}

        {/* Barre de progression avec effet de vague */}
        <div className="h-5 bg-white/20 relative overflow-hidden">
          <div
            className="h-full bg-white/95 transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-r from-white/60 via-white/95 to-white/60 animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/90 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-r from-white/40 via-white/95 to-white/40 animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-transparent animate-pulse" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icône avec animation spectaculaire */}
            <div className={`
              shrink-0 w-18 h-18 rounded-full ${styles.iconBg} 
              flex items-center justify-center
              ${isAnimating ? 'animate-bounce' : ''}
              relative overflow-hidden
            `}>
              <span className="text-5xl relative z-10">{styles.icon}</span>
              <div className="absolute inset-0 bg-white/50 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <h4 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {title}
              </h4>
              <p className="text-lg text-white/90 leading-relaxed drop-shadow">
                {message}
              </p>
            </div>

            {/* Bouton de fermeture avec animation */}
            <button
              onClick={onClose}
              className="shrink-0 text-white/70 hover:text-white transition-all duration-300 hover:scale-125 hover:rotate-90"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Effet de brillance en arrière-plan */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent animate-pulse" />
        
        {/* Bordure animée */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/50 animate-pulse" />
        
        {/* Effet de halo */}
        <div className="absolute inset-0 rounded-3xl bg-white/15 animate-pulse" />
        
        {/* Effet de scintillement */}
        <div className="absolute inset-0 rounded-3xl bg-linear-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        
        {/* Effet de vague */}
        <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-transparent via-white/5 to-transparent animate-pulse" />
      </div>
    </div>
  )
}


