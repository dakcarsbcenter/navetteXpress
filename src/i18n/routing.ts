import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "es"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
  // Sans détection, la langue vient uniquement de l'URL et le cookie NEXT_LOCALE
  // ne servait à rien, mais il partait en Set-Cookie sur chaque page : une
  // réponse qui pose un cookie n'est pas mise en cache par Cloudflare. Les
  // tableaux de bord ont leur propre cookie (src/lib/dashboard-locale.ts).
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
