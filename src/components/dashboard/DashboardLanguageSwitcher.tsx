"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Globe, CaretDown } from "@phosphor-icons/react"
import { routing } from "@/i18n/routing"
import { DASHBOARD_LOCALE_COOKIE } from "@/lib/dashboard-locale-cookie"

const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
}

interface DashboardLanguageSwitcherProps {
  className?: string
  dropDirection?: "up" | "down"
}

export function DashboardLanguageSwitcher({ className = "", dropDirection = "down" }: DashboardLanguageSwitcherProps) {
  const locale = useLocale()
  const t = useTranslations("common.actions")
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const switchTo = (nextLocale: string) => {
    if (nextLocale === locale || pending) return
    setPending(true)
    document.cookie = `${DASHBOARD_LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
    setPending(false)
  }

  return (
    <div className={`relative group/lang ${className}`}>
      <button
        type="button"
        aria-label={t("changeLanguage")}
        className="driver-dashboard-card inline-flex h-11 w-11 items-center justify-center gap-1 rounded-xl border border-(--border) bg-(--bg-card) text-(--text-muted) hover:border-(--accent) hover:text-(--text-primary)"
      >
        <Globe size={16} />
        <CaretDown size={10} />
      </button>

      <div
        className={`absolute left-0 z-50 w-36 rounded-xl border border-(--border) bg-(--bg-card) opacity-0 shadow-2xl invisible transition-all duration-200 group-hover/lang:visible group-hover/lang:opacity-100 ${
          dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        <div className="space-y-0.5 p-1.5">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchTo(l)}
              aria-current={l === locale ? "true" : undefined}
              className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                l === locale
                  ? "bg-(--bg-secondary) font-semibold text-(--accent)"
                  : "text-(--text-muted) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
