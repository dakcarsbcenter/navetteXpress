const INTL_LOCALE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

export function toIntlLocale(locale: string): string {
  return INTL_LOCALE_MAP[locale] ?? INTL_LOCALE_MAP.fr;
}
