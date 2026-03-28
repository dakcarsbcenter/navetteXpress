# Android OAuth E2E validation checklist

This checklist validates Google OAuth on Android for the Capacitor app.

## 1) Prerequisites

- Android app built with package `com.navettexpress.app`
- `public/.well-known/assetlinks.json` deployed with real SHA-256 fingerprint
- Google Cloud OAuth web client configured with callback:
  - `https://navettexpress.com/api/auth/callback/google`
- App links enabled and verified for `https://navettexpress.com`

## 2) Core flow test (real device)

1. Open the Android app.
2. Go to sign-in screen.
3. Tap `Continuer avec Google`.
4. Complete Google account selection and consent.
5. Confirm return path reaches:
   - `https://navettexpress.com/auth/mobile-callback?next=/dashboard`
6. Confirm in-app redirect lands on `/dashboard`.
7. Force-close app, reopen, confirm authenticated session still valid.

## 3) Negative and recovery paths

1. Cancel Google consent.
2. Confirm app returns to sign-in and displays OAuth error message.
3. Retry Google sign-in and complete successfully.
4. Test network interruption during callback and verify retry works.

## 4) Deep link and app link validation

1. Execute app link command (replace package if needed):

```bash
adb shell am start -a android.intent.action.VIEW -d "https://navettexpress.com/auth/mobile-callback?next=/dashboard" com.navettexpress.app
```

2. Confirm app opens and redirects to dashboard when session exists.
3. Confirm app redirects to sign-in with error when no session exists.

## 5) Compatibility checks

- Credentials login still works (`email/password`).
- Google login works after credentials logout.
- Role-based dashboard redirection still works from `/dashboard`.
- No infinite redirect loop on app start.
- No crash when opening deep links with custom scheme:
  - `navettexpress://auth/callback?next=/dashboard`

## 6) Go/No-Go criteria

- 100% pass on core flow test.
- 0 crash on OAuth callback path.
- 0 blocker for session persistence.
- App links verified in production.
