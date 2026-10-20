import { routing } from "@/i18n/routing";

const BASE_URL = "https://navettexpress.com";

/**
 * Builds the `alternates` metadata block (canonical + hreflang) for a
 * given unprefixed pathname (e.g. "" for home, "/flotte" for the fleet page).
 *
 * Les codes hreflang sont des codes de langue seuls (fr, en, es) : le site cible
 * le Senegal et le public anglophone/hispanophone sans distinction de pays, et
 * ce sont les memes codes que l'en-tete HTTP `Link` emis par next-intl. Un
 * `x-default` pointe vers la version francaise (langue par defaut, sans prefixe).
 */
export function buildAlternates(pathname: string, locale: string) {
  const cleanPath = pathname === "/" ? "" : pathname;
  const localizedUrl = (l: string) =>
    l === routing.defaultLocale ? `${BASE_URL}${cleanPath}` : `${BASE_URL}/${l}${cleanPath}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localizedUrl(l);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale);

  return {
    canonical: localizedUrl(locale),
    languages,
  };
}
