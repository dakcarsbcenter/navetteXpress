// Split out from dashboard-locale.ts on purpose: that module imports
// next/headers (server-only), but this constant also needs to be readable
// from "use client" components like DashboardLanguageSwitcher.
export const DASHBOARD_LOCALE_COOKIE = "dashboard_locale";
