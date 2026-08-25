"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations("common.actions")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t("toggleTheme")}
        className="h-11 w-11 rounded-xl border border-(--border) bg-(--bg-card)"
      />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("toggleTheme")}
      className="driver-dashboard-card inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--border) bg-(--bg-card) text-lg text-(--text-primary) hover:border-(--accent)"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  )
}
