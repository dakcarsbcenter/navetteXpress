import type { CapacitorConfig } from '@capacitor/cli'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env' })
loadEnv({ path: '.env.local', override: true })

const rawServerUrl = process.env.CAPACITOR_SERVER_URL ?? process.env.NEXT_PUBLIC_APP_URL

const normalizeAndroidServerUrl = (input?: string): string | undefined => {
  if (!input) return undefined

  try {
    const parsedUrl = new URL(input)

    // Android emulator reaches host machine via 10.0.2.2 instead of localhost.
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      parsedUrl.hostname = '10.0.2.2'
    }

    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return input
  }
}

const serverUrl = normalizeAndroidServerUrl(rawServerUrl)
const isHttpServer = serverUrl?.startsWith('http://') ?? false

const config: CapacitorConfig = {
  appId: 'com.navettexpress.app',
  appName: 'NavetteXpress',
  webDir: 'mobile-shell',
  server: {
    url: serverUrl,
    cleartext: isHttpServer,
    androidScheme: isHttpServer ? 'http' : 'https',
  },
}

export default config
