import type { CapacitorConfig } from '@capacitor/cli'

const serverUrl = process.env.CAPACITOR_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.navettexpress.app',
  appName: 'NavetteXpress',
  webDir: 'mobile-shell',
  server: {
    url: serverUrl,
    cleartext: serverUrl?.startsWith('http://') ?? false,
    androidScheme: 'https',
  },
}

export default config
