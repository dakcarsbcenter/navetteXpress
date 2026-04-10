# Android deployment bootstrap (Capacitor)

This document starts the Android implementation for NavetteXpress.

## 1) Prerequisites

- Node.js LTS and npm
- Android Studio (latest stable)
- JDK 17
- Android SDK + platform tools
- A Google Play Console account
- A Google Cloud project for OAuth

## 2) Initial setup

Run the following commands from project root (PowerShell):

```powershell
npm install
npm run mobile:android:init
$env:CAPACITOR_SERVER_URL='https://navettexpress.com'
npm run mobile:sync
npm run mobile:open:android
```

CMD alternative:

```bat
set CAPACITOR_SERVER_URL=https://navettexpress.com
npm run mobile:sync
```

Verify that `android/app/src/main/assets/capacitor.config.json` contains:

```json
{
   "server": {
      "url": "https://navettexpress.com"
   }
}
```

Notes:
- `CAPACITOR_SERVER_URL` points Android WebView to your deployed web app.
- `mobile:sync` syncs Capacitor plugins and the latest config.
- Android intent filters for app links and custom scheme are now configured in AndroidManifest.

## 3) OAuth and deep links checklist

- Configure package name: `com.navettexpress.app`
- Configure Android App Links domain in Play/Google Cloud setup
- Publish `.well-known/assetlinks.json` on production domain
- Register OAuth redirect URIs for Android flow
- Validate login with credentials and Google OAuth on real device

## 3.1) Mobile OAuth callback strategy (implemented)

- Google sign-in now uses a dedicated callback path on native Android:
   - `/auth/mobile-callback?next=/dashboard`
- Callback route validates session state and redirects safely:
   - authenticated => `next` path (default `/dashboard`)
   - unauthenticated or OAuth error => `/auth/signin?error=...`
- Capacitor URL listener handles:
   - HTTPS app links (ex: `https://navettexpress.com/...`)
   - Custom scheme links (ex: `navettexpress://auth/callback?...`)

See full validation steps in:
- `ANDROID_OAUTH_E2E_CHECKLIST.md`

## 4) Internal testing release flow

1. Generate signed AAB in Android Studio.
2. Upload to Play Console Internal testing track.
3. Add testers and validate core paths:
   - Sign in/sign out
   - Booking flow
   - Client dashboard
   - Driver dashboard
   - Profile photo upload

## 5) Exit criteria before production

- No blocking auth issue
- No critical crash in top user flows
- Deep links open the correct screens
- Build reproducible in CI
