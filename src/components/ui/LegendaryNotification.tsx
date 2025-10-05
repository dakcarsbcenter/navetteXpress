"use client"

import { useEffect, useState, useRef } from "react"

interface LegendaryNotificationProps {
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
  showGalaxy?: boolean
  showNebula?: boolean
}

export function LegendaryNotification({
  isVisible,
  title,
  message,
  type,
  duration = 12000,
  onClose,
  showParticles = true,
  showConfetti = false,
  showFireworks = false,
  showLightning = false,
  showRainbow = false,
  showHologram = false,
  showMeteors = false,
  showAurora = false,
  showGalaxy = false,
  showNebula = false
}: LegendaryNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(100)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; rotation: number; pulse: number; wave: number }>>([])
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; life: number; rotation: number; shape: string; scale: number; bounce: number }>>([])
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; trail: Array<{ x: number; y: number; life: number }>; sparkles: Array<{ x: number; y: number; life: number; color: string }>; rings: Array<{ x: number; y: number; life: number; size: number }> }>>([])
  const [lightning, setLightning] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number; branches: Array<{ x: number; y: number; life: number }>; forks: Array<{ x: number; y: number; life: number }>; sparks: Array<{ x: number; y: number; life: number; color: string }> }>>([])
  const [rainbow, setRainbow] = useState<Array<{ id: number; x: number; y: number; life: number; color: string; size: number; rotation: number; wave: number }>>([])
  const [hologram, setHologram] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number; phase: number; frequency: number }>>([])
  const [meteors, setMeteors] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; trail: Array<{ x: number; y: number; life: number }>; glow: number }>>([])
  const [aurora, setAurora] = useState<Array<{ id: number; x: number; y: number; life: number; intensity: number; color: string; wave: number; frequency: number }>>([])
  const [galaxy, setGalaxy] = useState<Array<{ id: number; x: number; y: number; life: number; size: number; color: string; rotation: number; spiral: number }>>([])
  const [nebula, setNebula] = useState<Array<{ id: number; x: number; y: number; life: number; size: number; color: string; intensity: number; wave: number; frequency: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Créer des particules colorées avec rotation, pulsation et vague
      if (showParticles) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd3a5', '#dda0dd', '#98d8c8', '#ffb3ba', '#bae1ff', '#ffcccb', '#e6e6fa']
        const newParticles = Array.from({ length: 120 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          size: Math.random() * 6 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          pulse: Math.random() * 3 + 0.5,
          wave: Math.random() * Math.PI * 2
        }))
        setParticles(newParticles)
      }

      // Créer des confettis avec formes différentes, échelle et rebond
      if (showConfetti && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd3a5']
        const shapes = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'hexagon', 'octagon']
        const newConfetti = Array.from({ length: 200 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: -10,
          vx: (Math.random() - 0.5) * 12,
          vy: Math.random() * 8 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          rotation: Math.random() * 360,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          scale: Math.random() * 0.8 + 0.2,
          bounce: Math.random() * 0.5 + 0.5
        }))
        setConfetti(newConfetti)
      }

      // Créer des feux d'artifice avec traînées, étincelles et anneaux
      if (showFireworks && type === 'success') {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        const newFireworks = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 10 + 5,
          trail: Array.from({ length: 12 }, (_, j) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          })),
          sparkles: Array.from({ length: 20 }, (_, k) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)]
          })),
          rings: Array.from({ length: 8 }, (_, l) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1,
            size: Math.random() * 20 + 10
          }))
        }))
        setFireworks(newFireworks)
      }

      // Créer des éclairs avec branches, fourches et étincelles
      if (showLightning && type === 'error') {
        const newLightning = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.95 + 0.05,
          branches: Array.from({ length: 8 }, (_, j) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          })),
          forks: Array.from({ length: 5 }, (_, k) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          })),
          sparks: Array.from({ length: 10 }, (_, l) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1,
            color: '#ffffff'
          }))
        }))
        setLightning(newLightning)
      }

      // Créer un arc-en-ciel avec rotation et vague
      if (showRainbow && type === 'success') {
        const rainbowColors = ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff80', '#00ffff', '#0080ff', '#8000ff']
        const newRainbow = Array.from({ length: 80 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          color: rainbowColors[i % rainbowColors.length],
          size: Math.random() * 6 + 1,
          rotation: Math.random() * 360,
          wave: Math.random() * Math.PI * 2
        }))
        setRainbow(newRainbow)
      }

      // Créer un effet holographique avec phase et fréquence
      if (showHologram) {
        const newHologram = Array.from({ length: 25 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2,
          frequency: Math.random() * 0.1 + 0.05
        }))
        setHologram(newHologram)
      }

      // Créer des météores avec traînées et lueur
      if (showMeteors) {
        const colors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57']
        const newMeteors = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1,
          size: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          trail: Array.from({ length: 10 }, (_, j) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            life: 1
          })),
          glow: Math.random() * 0.8 + 0.2
        }))
        setMeteors(newMeteors)
      }

      // Créer une aurore boréale avec vague et fréquence
      if (showAurora) {
        const auroraColors = ['#00ff88', '#00ffcc', '#00ccff', '#0088ff', '#4400ff', '#8800ff']
        const newAurora = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          intensity: Math.random() * 0.8 + 0.2,
          color: auroraColors[Math.floor(Math.random() * auroraColors.length)],
          wave: Math.random() * Math.PI * 2,
          frequency: Math.random() * 0.1 + 0.05
        }))
        setAurora(newAurora)
      }

      // Créer une galaxie
      if (showGalaxy) {
        const galaxyColors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3']
        const newGalaxy = Array.from({ length: 40 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          size: Math.random() * 8 + 2,
          color: galaxyColors[Math.floor(Math.random() * galaxyColors.length)],
          rotation: Math.random() * 360,
          spiral: Math.random() * Math.PI * 2
        }))
        setGalaxy(newGalaxy)
      }

      // Créer une nébuleuse
      if (showNebula) {
        const nebulaColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        const newNebula = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 1,
          size: Math.random() * 12 + 4,
          color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
          intensity: Math.random() * 0.6 + 0.4,
          wave: Math.random() * Math.PI * 2,
          frequency: Math.random() * 0.1 + 0.05
        }))
        setNebula(newNebula)
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
          life: p.life - 0.006,
          rotation: p.rotation + 4,
          pulse: p.pulse + 0.15,
          wave: p.wave + 0.1
        })).filter(p => p.life > 0))

        setConfetti(prev => prev.map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          life: c.life - 0.003,
          rotation: c.rotation + 12,
          scale: c.scale + 0.015,
          bounce: c.bounce + 0.1
        })).filter(c => c.life > 0))

        setFireworks(prev => prev.map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          life: f.life - 0.004,
          trail: f.trail.map(t => ({
            ...t,
            life: t.life - 0.012
          })).filter(t => t.life > 0),
          sparkles: f.sparkles.map(s => ({
            ...s,
            life: s.life - 0.018
          })).filter(s => s.life > 0),
          rings: f.rings.map(r => ({
            ...r,
            life: r.life - 0.01
          })).filter(r => r.life > 0)
        })).filter(f => f.life > 0))

        setLightning(prev => prev.map(l => ({
          ...l,
          life: l.life - 0.01,
          intensity: Math.random() * 0.95 + 0.05,
          branches: l.branches.map(b => ({
            ...b,
            life: b.life - 0.02
          })).filter(b => b.life > 0),
          forks: l.forks.map(f => ({
            ...f,
            life: f.life - 0.025
          })).filter(f => f.life > 0),
          sparks: l.sparks.map(s => ({
            ...s,
            life: s.life - 0.03
          })).filter(s => s.life > 0)
        })).filter(l => l.life > 0))

        setRainbow(prev => prev.map(r => ({
          ...r,
          life: r.life - 0.006,
          rotation: r.rotation + 3,
          wave: r.wave + 0.08
        })).filter(r => r.life > 0))

        setHologram(prev => prev.map(h => ({
          ...h,
          life: h.life - 0.012,
          intensity: Math.random() * 0.8 + 0.2,
          phase: h.phase + h.frequency,
          frequency: h.frequency + 0.001
        })).filter(h => h.life > 0))

        setMeteors(prev => prev.map(m => ({
          ...m,
          x: m.x + m.vx,
          y: m.y + m.vy,
          life: m.life - 0.008,
          trail: m.trail.map(t => ({
            ...t,
            life: t.life - 0.018
          })).filter(t => t.life > 0),
          glow: m.glow + 0.05
        })).filter(m => m.life > 0))

        setAurora(prev => prev.map(a => ({
          ...a,
          life: a.life - 0.008,
          intensity: Math.random() * 0.8 + 0.2,
          wave: a.wave + a.frequency,
          frequency: a.frequency + 0.002
        })).filter(a => a.life > 0))

        setGalaxy(prev => prev.map(g => ({
          ...g,
          life: g.life - 0.01,
          rotation: g.rotation + 2,
          spiral: g.spiral + 0.05
        })).filter(g => g.life > 0))

        setNebula(prev => prev.map(n => ({
          ...n,
          life: n.life - 0.008,
          intensity: Math.random() * 0.6 + 0.4,
          wave: n.wave + n.frequency,
          frequency: n.frequency + 0.001
        })).filter(n => n.life > 0))
      }, 50)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 1500)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
        clearInterval(effectInterval)
      }
    }
  }, [isVisible, duration, onClose, type, showParticles, showConfetti, showFireworks, showLightning, showRainbow, showHologram, showMeteors, showAurora, showGalaxy, showNebula])

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
          shadow: 'shadow-emerald-500/70',
          glow: 'shadow-emerald-500/100'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600',
          icon: '💥',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-300',
          shadow: 'shadow-red-500/70',
          glow: 'shadow-red-500/100'
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600',
          icon: '⚡',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          border: 'border-amber-300',
          shadow: 'shadow-amber-500/70',
          glow: 'shadow-amber-500/100'
        }
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
          icon: '✨',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          border: 'border-cyan-300',
          shadow: 'shadow-cyan-500/70',
          glow: 'shadow-cyan-500/100'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-400 via-slate-500 to-zinc-600',
          icon: '💫',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          border: 'border-gray-300',
          shadow: 'shadow-gray-500/70',
          glow: 'shadow-gray-500/100'
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
          transform transition-all duration-2000 ease-out
          ${isAnimating ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-full opacity-0 scale-95 rotate-12'}
          ${styles.shadow} ${styles.glow}
          relative
        `}
      >
        {/* Particules colorées avec rotation, pulsation et vague */}
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
              opacity: particle.life * Math.sin(particle.pulse) * Math.cos(particle.wave),
              transform: `scale(${particle.life}) rotate(${particle.rotation}deg)`,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`
            }}
          />
        ))}

        {/* Confettis avec formes différentes, échelle et rebond */}
        {showConfetti && confetti.map(confetti => (
          <div
            key={confetti.id}
            className="absolute pointer-events-none"
            style={{
              left: `${confetti.x}%`,
              top: `${confetti.y}%`,
              width: '12px',
              height: '12px',
              backgroundColor: confetti.color,
              opacity: confetti.life * Math.sin(confetti.bounce),
              transform: `rotate(${confetti.rotation}deg) scale(${confetti.life * confetti.scale})`,
              borderRadius: confetti.shape === 'circle' ? '50%' : confetti.shape === 'square' ? '0%' : confetti.shape === 'triangle' ? '0%' : '50%',
              clipPath: confetti.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : confetti.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : confetti.shape === 'heart' ? 'polygon(50% 85%, 15% 50%, 15% 25%, 50% 25%, 85% 25%, 85% 50%)' : confetti.shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : confetti.shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : confetti.shape === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' : 'none'
            }}
          />
        ))}

        {/* Feux d'artifice avec traînées, étincelles et anneaux */}
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
                boxShadow: `0 0 ${firework.size * 5}px ${firework.color}`
              }}
            />
            {firework.trail.map((trail, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${trail.x}%`,
                  top: `${trail.y}%`,
                  width: `${firework.size * 0.7}px`,
                  height: `${firework.size * 0.7}px`,
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
                  width: '3px',
                  height: '3px',
                  backgroundColor: sparkle.color,
                  opacity: sparkle.life * firework.life,
                  transform: `scale(${sparkle.life})`,
                  boxShadow: `0 0 6px ${sparkle.color}`
                }}
              />
            ))}
            {firework.rings.map((ring, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none border-2"
                style={{
                  left: `${ring.x}%`,
                  top: `${ring.y}%`,
                  width: `${ring.size}px`,
                  height: `${ring.size}px`,
                  borderColor: firework.color,
                  opacity: ring.life * firework.life,
                  transform: `scale(${ring.life})`,
                  boxShadow: `0 0 ${ring.size}px ${firework.color}`
                }}
              />
            ))}
          </div>
        ))}

        {/* Éclairs avec branches, fourches et étincelles */}
        {showLightning && lightning.map(lightning => (
          <div key={lightning.id}>
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${lightning.x}%`,
                top: `${lightning.y}%`,
                width: '5px',
                height: '50px',
                backgroundColor: '#ffffff',
                opacity: lightning.life * lightning.intensity,
                transform: `rotate(${Math.random() * 360}deg)`,
                boxShadow: '0 0 25px #ffffff'
              }}
            />
            {lightning.branches.map((branch, index) => (
              <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: `${branch.x}%`,
                  top: `${branch.y}%`,
                  width: '4px',
                  height: '25px',
                  backgroundColor: '#ffffff',
                  opacity: branch.life * lightning.life,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  boxShadow: '0 0 20px #ffffff'
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
                  width: '3px',
                  height: '20px',
                  backgroundColor: '#ffffff',
                  opacity: fork.life * lightning.life,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  boxShadow: '0 0 15px #ffffff'
                }}
              />
            ))}
            {lightning.sparks.map((spark, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${spark.x}%`,
                  top: `${spark.y}%`,
                  width: '2px',
                  height: '2px',
                  backgroundColor: spark.color,
                  opacity: spark.life * lightning.life,
                  transform: `scale(${spark.life})`,
                  boxShadow: `0 0 8px ${spark.color}`
                }}
              />
            ))}
          </div>
        ))}

        {/* Arc-en-ciel avec rotation et vague */}
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
              opacity: rainbow.life * Math.sin(rainbow.wave),
              transform: `scale(${rainbow.life}) rotate(${rainbow.rotation}deg)`,
              boxShadow: `0 0 ${rainbow.size * 4}px ${rainbow.color}`
            }}
          />
        ))}

        {/* Effet holographique avec phase et fréquence */}
        {showHologram && hologram.map(hologram => (
          <div
            key={hologram.id}
            className="absolute pointer-events-none"
            style={{
              left: `${hologram.x}%`,
              top: `${hologram.y}%`,
              width: '30px',
              height: '30px',
              backgroundColor: '#ffffff',
              opacity: hologram.life * hologram.intensity * Math.sin(hologram.phase) * 0.5,
              transform: `scale(${hologram.life}) rotate(${hologram.x * 3.6}deg)`,
              boxShadow: '0 0 30px #ffffff',
              borderRadius: '50%'
            }}
          />
        ))}

        {/* Météores avec traînées et lueur */}
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
                opacity: meteor.life * meteor.glow,
                transform: `scale(${meteor.life})`,
                boxShadow: `0 0 ${meteor.size * 3}px ${meteor.color}`
              }}
            />
            {meteor.trail.map((trail, index) => (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${trail.x}%`,
                  top: `${trail.y}%`,
                  width: `${meteor.size * 0.6}px`,
                  height: `${meteor.size * 0.6}px`,
                  backgroundColor: meteor.color,
                  opacity: trail.life * meteor.life * meteor.glow,
                  transform: `scale(${trail.life})`
                }}
              />
            ))}
          </div>
        ))}

        {/* Aurore boréale avec vague et fréquence */}
        {showAurora && aurora.map(aurora => (
          <div
            key={aurora.id}
            className="absolute pointer-events-none"
            style={{
              left: `${aurora.x}%`,
              top: `${aurora.y}%`,
              width: '35px',
              height: '35px',
              backgroundColor: aurora.color,
              opacity: aurora.life * aurora.intensity * Math.sin(aurora.wave) * 0.7,
              transform: `scale(${aurora.life}) rotate(${aurora.x * 3.6}deg)`,
              boxShadow: `0 0 35px ${aurora.color}`,
              borderRadius: '50%'
            }}
          />
        ))}

        {/* Galaxie */}
        {showGalaxy && galaxy.map(galaxy => (
          <div
            key={galaxy.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${galaxy.x}%`,
              top: `${galaxy.y}%`,
              width: `${galaxy.size}px`,
              height: `${galaxy.size}px`,
              backgroundColor: galaxy.color,
              opacity: galaxy.life,
              transform: `scale(${galaxy.life}) rotate(${galaxy.rotation}deg)`,
              boxShadow: `0 0 ${galaxy.size * 2}px ${galaxy.color}`
            }}
          />
        ))}

        {/* Nébuleuse */}
        {showNebula && nebula.map(nebula => (
          <div
            key={nebula.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${nebula.x}%`,
              top: `${nebula.y}%`,
              width: `${nebula.size}px`,
              height: `${nebula.size}px`,
              backgroundColor: nebula.color,
              opacity: nebula.life * nebula.intensity * Math.sin(nebula.wave),
              transform: `scale(${nebula.life})`,
              boxShadow: `0 0 ${nebula.size * 3}px ${nebula.color}`
            }}
          />
        ))}

        {/* Barre de progression avec effet de vague */}
        <div className="h-6 bg-white/20 relative overflow-hidden">
          <div
            className="h-full bg-white/95 transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/90 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/95 to-white/70 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/95 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/95 to-white/50 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/95 to-white/30 animate-pulse" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icône avec animation spectaculaire */}
            <div className={`
              flex-shrink-0 w-20 h-20 rounded-full ${styles.iconBg} 
              flex items-center justify-center
              ${isAnimating ? 'animate-bounce' : ''}
              relative overflow-hidden
            `}>
              <span className="text-6xl relative z-10">{styles.icon}</span>
              <div className="absolute inset-0 bg-white/60 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-white/50 rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-white/40 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <h4 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {title}
              </h4>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow">
                {message}
              </p>
            </div>

            {/* Bouton de fermeture avec animation */}
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/70 hover:text-white transition-all duration-300 hover:scale-125 hover:rotate-90"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Effet de brillance en arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        
        {/* Bordure animée */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/60 animate-pulse" />
        
        {/* Effet de halo */}
        <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse" />
        
        {/* Effet de scintillement */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse" />
        
        {/* Effet de vague */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-white/10 to-transparent animate-pulse" />
        
        {/* Effet de spirale */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      </div>
    </div>
  )
}
