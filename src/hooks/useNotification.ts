"use client"

import { useState, useCallback } from "react"

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  showModal?: boolean
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    options: { duration?: number; showModal?: boolean } = {}
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: Notification = {
      id,
      title,
      message,
      type,
      duration: options.duration || 3000,
      showModal: options.showModal || false
    }

    setNotifications(prev => [...prev, notification])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, title: string = 'Succès', options?: { duration?: number; showModal?: boolean }) => {
    addNotification(title, message, 'success', options)
  }, [addNotification])

  const showError = useCallback((message: string, title: string = 'Erreur', options?: { duration?: number; showModal?: boolean }) => {
    addNotification(title, message, 'error', options)
  }, [addNotification])

  const showWarning = useCallback((message: string, title: string = 'Attention', options?: { duration?: number; showModal?: boolean }) => {
    addNotification(title, message, 'warning', options)
  }, [addNotification])

  const showInfo = useCallback((message: string, title: string = 'Information', options?: { duration?: number; showModal?: boolean }) => {
    addNotification(title, message, 'info', options)
  }, [addNotification])

  // Pour la compatibilité avec l'ancien système
  const notification = notifications.length > 0 ? {
    isOpen: true,
    title: notifications[notifications.length - 1].title,
    message: notifications[notifications.length - 1].message,
    type: notifications[notifications.length - 1].type
  } : {
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as const
  }

  const hideNotification = useCallback(() => {
    if (notifications.length > 0) {
      removeNotification(notifications[notifications.length - 1].id)
    }
  }, [notifications, removeNotification])

  return {
    notifications,
    notification,
    addNotification,
    removeNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
