"use client";

import NextLink from "next/link";
import { useLocale } from "next-intl";
import { Globe, CaretDown } from "@phosphor-icons/react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline";
  className?: string;
}

export function LanguageSwitcher({ variant = "dropdown", className = "" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();

  // Vrais liens <a href hreflang> plutot que des boutons : les versions
  // linguistiques de la page courante sont decouvrables par les robots depuis
  // toutes les pages. L'URL vient de getPathname (pas de prefixe pour la langue
  // par defaut) : le <Link locale> de next-intl forcerait /fr, qui redirige vers /.
  // Pas de prefetch : trois liens par page, rarement suivis.
  const localeLinkProps = (l: string) => ({
    href: getPathname({ href: pathname, locale: l }),
    hrefLang: l,
    lang: l,
    prefetch: false,
  });

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {routing.locales.map((l) => (
          <NextLink
            key={l}
            {...localeLinkProps(l)}
            className={`text-sm font-medium transition-colors ${
              l === locale ? "text-accent" : "text-foreground/70 hover:text-accent"
            }`}
            aria-current={l === locale ? "true" : undefined}
          >
            {LOCALE_LABELS[l]}
          </NextLink>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative group/lang ${className}`}>
      <button
        className="flex items-center gap-1.5 text-foreground/70 hover:text-accent text-sm font-medium transition-colors"
        aria-label="Changer de langue"
      >
        <Globe size={16} weight="light" />
        <span className="uppercase">{locale}</span>
        <CaretDown size={12} weight="light" />
      </button>

      <div className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-300 backdrop-blur-xl z-50">
        <div className="p-2 space-y-1">
          {routing.locales.map((l) => (
            <NextLink
              key={l}
              {...localeLinkProps(l)}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                l === locale
                  ? "text-accent font-semibold bg-surface-2/50"
                  : "text-foreground/70 hover:text-accent hover:bg-surface-2/50"
              }`}
            >
              {LOCALE_LABELS[l]}
            </NextLink>
          ))}
        </div>
      </div>
    </div>
  );
}
