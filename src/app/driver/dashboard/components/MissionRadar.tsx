"use client"

import { useTranslations } from "next-intl"
import styles from "@/styles/driver-dashboard.module.css"

export function MissionRadar() {
  const t = useTranslations("driver.home.missionRadar")

  return (
    <section className="driver-dashboard-card flex h-full min-h-60 flex-col items-center justify-center rounded-2xl border border-(--border) bg-(--bg-card) p-4 text-center sm:min-h-[280px] sm:p-6">
      <div className={styles.radarWrap}>
        <div className={styles.radarRing} />
        <div className="z-10 text-3xl sm:text-4xl">🎯</div>
      </div>

      <h3 className="mt-4 font-heading text-xl font-bold uppercase tracking-wide text-(--accent) sm:mt-6 sm:text-2xl">
        {t("title")}
      </h3>
      <p className="mt-2 text-xs text-(--text-muted) sm:text-sm">
        {t("description")}
      </p>
    </section>
  )
}
