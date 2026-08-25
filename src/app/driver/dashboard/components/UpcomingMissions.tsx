"use client"

import { useTranslations } from "next-intl"
import type { MissionItem, UpcomingMissionsProps } from "@/types/dashboard"
import { EmptyState } from "@/components/driver/shared"

function getStatusStyle(status: MissionItem["status"]): string {
  if (status === "delayed") {
    return "bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-(--danger)"
  }

  if (status === "cancelled") {
    return "bg-[color-mix(in_srgb,var(--text-muted)_20%,transparent)] text-(--text-muted)"
  }

  return "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-(--success)"
}

export function UpcomingMissions({ missions }: UpcomingMissionsProps) {
  const t = useTranslations("driver.home.upcomingMissions")
  const tStatus = useTranslations("driver.home.missionStatus")

  return (
    <section className="driver-dashboard-card rounded-2xl border border-(--border) border-l-4 border-l-(--accent) bg-(--bg-card) p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between sm:mb-5">
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-(--text-primary) sm:text-lg">{t("title")}</h3>
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-(--accent)" />
      </header>

      {missions.length === 0 ? (
        <EmptyState icon={<div className="text-2xl">🚕</div>} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {missions.map((mission) => (
            <article
              key={mission.id}
              className="driver-dashboard-card flex items-center justify-between rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-secondary)_70%,transparent)] px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <div>
                <p className="text-xs font-semibold text-(--text-primary) sm:text-sm">
                  {mission.departure} → {mission.destination}
                </p>
                <p className="text-[11px] text-(--text-muted) sm:text-xs">{mission.time}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs ${getStatusStyle(mission.status)}`}>
                {tStatus(mission.status)}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
