import { cookies } from "next/headers";
import { routing, type Locale } from "@/i18n/routing";
import { DASHBOARD_LOCALE_COOKIE } from "@/lib/dashboard-locale-cookie";

export { DASHBOARD_LOCALE_COOKIE };

export async function getDashboardLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(DASHBOARD_LOCALE_COOKIE)?.value;
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}
