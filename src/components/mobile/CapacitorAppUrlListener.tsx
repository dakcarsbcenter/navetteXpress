'use client'

import { useEffect } from 'react'

export function CapacitorAppUrlListener() {
  useEffect(() => {
    let removeListener: (() => Promise<void>) | undefined

    const init = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')

        if (Capacitor.getPlatform() === 'web') {
          return
        }

        const { App } = await import('@capacitor/app')

        const listener = await App.addListener('appUrlOpen', (event) => {
          if (!event.url) {
            return
          }

          try {
            const url = new URL(event.url)
            const path = `${url.pathname}${url.search}${url.hash}`
            window.location.assign(path || '/')
          } catch {
            window.location.assign('/')
          }
        })

        removeListener = () => listener.remove()
      } catch {
        // Ignore listener errors on non-Capacitor runtimes.
      }
    }

    void init()

    return () => {
      if (removeListener) {
        void removeListener()
      }
    }
  }, [])

  return null
}
