import { routing } from "@/i18n/routing";

const BASE_URL = "https://navettexpress.com";

const LOCALE_TAGS: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

/**
 * Builds the `alternates` metadata block (canonical + hreflang) for a
 * given unprefixed pathname (e.g. "" for home, "/flotte" for the fleet page).
 */
export function buildAlternates(pathname: string, locale: string) {
  const cleanPath = pathname === "/" ? "" : pathname;
  const localizedUrl = (l: string) =>
    l === routing.defaultLocale ? `${BASE_URL}${cleanPath}` : `${BASE_URL}/${l}${cleanPath}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[LOCALE_TAGS[l] ?? l] = localizedUrl(l);
  }

  return {
    canonical: localizedUrl(locale),
    languages,
  };
}
