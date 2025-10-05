"use client"

import { useState, useEffect } from "react"
import { ConfirmationModal } from "./ConfirmationModal"
import { EpicNotification } from "./EpicNotification"

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  showModal?: boolean
}

interface NotificationCenterProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export function NotificationCenter({ notifications, onRemove }: NotificationCenterProps) {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1]
      setCurrentNotification(latest)
    } else {
      setCurrentNotification(null)
    }
  }, [notifications])

  const handleClose = (id: string) => {
    onRemove(id)
  }

  if (!currentNotification) return null

  const { showModal = false, duration = 3000, ...notification } = currentNotification

  if (showModal) {
    return (
      <ConfirmationModal
        isOpen={true}
        onClose={() => handleClose(currentNotification.id)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText="OK"
      />
    )
  }

  return (
    <EpicNotification
      isVisible={true}
      title={notification.title}
      message={notification.message}
      type={notification.type}
      duration={duration}
      onClose={() => handleClose(currentNotification.id)}
      showParticles={true}
      showConfetti={notification.type === 'success'}
      showFireworks={notification.type === 'success'}
      showLightning={notification.type === 'error'}
      showRainbow={notification.type === 'success'}
      showHologram={true}
      showMeteors={notification.type === 'warning'}
      showAurora={notification.type === 'info'}
    />
  )
}
