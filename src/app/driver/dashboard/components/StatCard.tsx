"use client"

import { useEffect, useMemo, useState } from "react"
import type { StatCardProps } from "@/types/dashboard"
import styles from "@/styles/driver-dashboard.module.css"

const delayClassMap: Record<number, string> = {
  0: styles.delay0,
  100: styles.delay1,
  200: styles.delay2,
  300: styles.delay3,
}

function parseValue(input: string | number): { target: number; prefix: string; suffix: string; isNumeric: boolean } {
  if (typeof input === "number") {
    return { target: input, prefix: "", suffix: "", isNumeric: true }
  }

  const match = input.match(/^(.*?)(\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) {
    return { target: 0, prefix: "", suffix: input, isNumeric: false }
  }

  const parsed = Number(match[2].replace(",", "."))
  return {
    target: Number.isFinite(parsed) ? parsed : 0,
    prefix: match[1],
    suffix: match[3],
    isNumeric: Number.isFinite(parsed),
  }
}

export function StatCard({ icon: Icon, label, value, trend, trendType = "neutral", animationDelay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const parsedValue = useMemo(() => parseValue(value), [value])

  useEffect(() => {
    if (!parsedValue.isNumeric) {
      return
    }

    let frameId = 0
    const duration = 900
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const nextValue = parsedValue.target * progress
      setDisplayValue(nextValue)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [parsedValue.isNumeric, parsedValue.target])

  const trendStyles = {
    up: "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-(--success)",
    down: "bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-(--danger)",
    neutral: "bg-white/5 text-(--text-muted)",
  }

  const rounded = parsedValue.target % 1 === 0 ? Math.round(displayValue).toString() : displayValue.toFixed(1)
  const finalText = parsedValue.isNumeric ? `${parsedValue.prefix}${rounded}${parsedValue.suffix}` : String(value)

  return (
    <article
      className={`driver-dashboard-card ${styles.statCard} ${delayClassMap[animationDelay] ?? styles.delay0} relative rounded-2xl border border-(--border) bg-(--bg-card) p-4 sm:p-5`}
    >
      {trend && (
        <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs ${trendStyles[trendType]}`}>
          {trend}
        </span>
      )}

      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-(--accent) sm:mb-4 sm:h-10 sm:w-10">
        <Icon size={18} />
      </div>

      <p className="text-xs text-(--text-muted) sm:text-sm">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-bold text-(--text-primary) sm:mt-2 sm:text-3xl">{finalText}</p>
    </article>
  )
}
