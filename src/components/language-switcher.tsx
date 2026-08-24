"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe, CaretDown } from "@phosphor-icons/react";
import { usePathname, useRouter } from "@/i18n/navigation";
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
  const router = useRouter();
  const params = useParams();

  const switchTo = (nextLocale: string) => {
    router.replace(
      // @ts-expect-error -- pathname is dynamic at runtime, typedRoutes not enforced here
      { pathname, params },
      { locale: nextLocale }
    );
  };

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {routing.locales.map((l) => (
          <button
            key={l}
            onClick={() => switchTo(l)}
            className={`text-sm font-medium transition-colors ${
              l === locale ? "text-accent" : "text-foreground/70 hover:text-accent"
            }`}
            aria-current={l === locale ? "true" : undefined}
          >
            {LOCALE_LABELS[l]}
          </button>
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
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                l === locale
                  ? "text-accent font-semibold bg-surface-2/50"
                  : "text-foreground/70 hover:text-accent hover:bg-surface-2/50"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
