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
            const isHttpProtocol = url.protocol === 'http:' || url.protocol === 'https:'
            const rawPath = isHttpProtocol
              ? `${url.pathname}${url.search}${url.hash}`
              : `/${url.host}${url.pathname}${url.search}${url.hash}`
            const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`

            window.location.assign(normalizedPath || '/')
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
