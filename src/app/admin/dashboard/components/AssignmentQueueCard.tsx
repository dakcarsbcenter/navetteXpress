"use client"

import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { formatDistanceToNowStrict, type Locale } from "date-fns"
import { fr, enUS, es } from "date-fns/locale"
import { WarningCircle, CheckCircle } from "@phosphor-icons/react"
import { toIntlLocale } from "@/lib/intl-locale"

const DATE_FNS_LOCALES: Record<string, Locale> = { fr, en: enUS, es }

export interface QueueItem {
  id: number
  ref: string
  clientName: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  passengers: number
  luggage: number
  duration: number
  price: number | null
  createdAt: string
}

export interface DriverInfo {
  id: string
  name: string
  vehicleLabel: string | null
  bookingsToday: number
  status: "available" | "busy" | "unavailable"
  reason?: string
  busyUntil?: string
}

interface AssignmentQueueCardProps {
  queue: QueueItem[]
  drivers: DriverInfo[] | null
  loadingDrivers: boolean
  assigningDriverId: string | null
  assignError: string | null
  onAssign: (driverId: string) => void
  onSkip: () => void
  onProposePrice: (price: number) => Promise<void>
  proposingPrice: boolean
}

function initialsOf(name: string) {
  return name.split(" ").map((part) => part[0]).filter(Boolean).join("").toUpperCase().slice(0, 2)
}

function formatDuration(hours: number) {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `~${h}H${String(m).padStart(2, "0")}`
  if (h > 0) return `~${h}H`
  return `~${m} MIN`
}

const STATUS_TONE: Record<DriverInfo["status"], { color: string; live?: boolean }> = {
  available: { color: "#1F5245" },
  busy: { color: "#1B9E4B", live: true },
  unavailable: { color: "#B8493C" },
}

export function AssignmentQueueCard({
  queue,
  drivers,
  loadingDrivers,
  assigningDriverId,
  assignError,
  onAssign,
  onSkip,
  onProposePrice,
  proposingPrice,
}: AssignmentQueueCardProps) {
  const t = useTranslations("admin.overview.queue")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const dateFnsLocale = DATE_FNS_LOCALES[locale] ?? fr

  const [priceFormOpen, setPriceFormOpen] = useState(false)
  const [priceValue, setPriceValue] = useState("")

  const current = queue[0]

  useEffect(() => {
    setPriceFormOpen(false)
    setPriceValue("")
  }, [current?.id])

  const activeDriversCount = drivers?.filter((d) => d.status === "available").length ?? 0
  const totalDriversCount = drivers?.length ?? 0

  const oldestLabel = current
    ? t("oldest", { time: formatDistanceToNowStrict(new Date(current.createdAt), { locale: dateFnsLocale }) })
    : ""

  const scheduledDate = current ? new Date(current.scheduledDateTime) : null
  const isToday = scheduledDate ? scheduledDate.toDateString() === new Date().toDateString() : false
  const whenLabel = scheduledDate
    ? isToday
      ? scheduledDate.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })
      : scheduledDate.toLocaleDateString(intlLocale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : ""

  async function submitPrice() {
    const amount = Number(priceValue)
    if (!Number.isFinite(amount) || amount <= 0) return
    await onProposePrice(amount)
    setPriceFormOpen(false)
    setPriceValue("")
  }

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 24px", borderBottom: "1px solid #E2DACD", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
          <span style={{ fontSize: "12.5px", color: "#6E6A63" }}>{t("description")}</span>
        </div>
        {current && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B4643A", whiteSpace: "nowrap" }}>
            {t("waiting", { count: queue.length })} · {oldestLabel}
          </span>
        )}
      </div>

      {!current && (
        <div style={{ padding: "44px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <CheckCircle size={30} weight="regular" color="#1F5245" />
          <span style={{ fontSize: "16px", fontWeight: 600 }}>{t("emptyTitle")}</span>
          <span style={{ fontSize: "13.5px", color: "#6E6A63", textAlign: "center", maxWidth: "34em", lineHeight: 1.55 }}>{t("emptyDescription")}</span>
        </div>
      )}

      {current && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1px", background: "#E2DACD" }}>
          <div style={{ padding: "24px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "26px", padding: "0 10px", borderRadius: "2px", background: "rgba(180,100,58,.10)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#B4643A" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B4643A" }}>{t("toAssign")}</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", color: "#6E6A63" }}>{t("ref")} {current.ref}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                <span style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid #1F5245", background: "#FFFFFF" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("departure")}</span>
              </div>
              <span style={{ flex: 1, height: "1.5px", background: "#12100E", margin: "0 14px 22px" }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, marginBottom: "22px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6E6A63" }}>{formatDuration(current.duration)}</span>
              </div>
              <span style={{ flex: 1, height: "1.5px", background: "#12100E", margin: "0 14px 22px" }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", flexShrink: 0 }}>
                <span style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid #B4643A", background: "#FFFFFF" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("arrival")}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{current.pickupAddress}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em" }}>{whenLabel}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", textAlign: "right" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{current.dropoffAddress}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", color: "#6E6A63" }}>{t("pax", { passengers: current.passengers, luggage: current.luggage })}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px 16px", background: "#F7F3EC", borderRadius: "3px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("client")}</span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{current.clientName}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "right" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("price")}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600 }}>
                  {current.price ? `${Math.round(current.price).toLocaleString(intlLocale)} FCFA` : "—"}
                </span>
              </div>
            </div>

            {priceFormOpen && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  min={0}
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder={t("proposePricePlaceholder")}
                  style={{ flex: 1, height: "40px", border: "1px solid #E2DACD", borderRadius: "3px", padding: "0 12px", fontFamily: "var(--font-mono)", fontSize: "13px" }}
                />
                <button
                  type="button"
                  disabled={proposingPrice}
                  onClick={submitPrice}
                  style={{ height: "40px", padding: "0 14px", background: "#1F5245", border: "none", borderRadius: "3px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: proposingPrice ? "wait" : "pointer" }}
                >
                  {t("proposePriceSubmit")}
                </button>
                <button
                  type="button"
                  onClick={() => { setPriceFormOpen(false); setPriceValue("") }}
                  style={{ height: "40px", padding: "0 14px", background: "transparent", border: "1px solid #E2DACD", borderRadius: "3px", color: "#6E6A63", fontSize: "13px", cursor: "pointer" }}
                >
                  {t("proposePriceCancel")}
                </button>
              </div>
            )}

            {assignError && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", border: "1px solid rgba(184,73,60,.45)", borderRadius: "3px", background: "rgba(184,73,60,.06)" }}>
                <WarningCircle size={18} weight="fill" color="#B8493C" style={{ flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#B8493C" }}>{t("assignRefused")}</span>
                  <span style={{ fontSize: "13px", color: "#3d3a35", lineHeight: 1.5 }}>{assignError}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "24px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("driversHeading", { when: whenLabel })}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("driversActive", { active: activeDriversCount, total: totalDriversCount })}</span>
            </div>

            {loadingDrivers && (
              <span style={{ fontSize: "13px", color: "#6E6A63" }}>…</span>
            )}

            {!loadingDrivers && drivers?.map((driver) => {
              const tone = STATUS_TONE[driver.status]
              const statusLabel = driver.status === "available" ? t("available") : driver.status === "busy" ? t("busy") : t("unavailable")
              return (
                <button
                  key={driver.id}
                  type="button"
                  disabled={assigningDriverId === driver.id}
                  onClick={() => onAssign(driver.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px",
                    padding: "12px 14px", background: "#FFFFFF",
                    border: `1px solid ${driver.status !== "available" ? "rgba(184,73,60,.30)" : "#E2DACD"}`,
                    borderRadius: "3px", cursor: assigningDriverId === driver.id ? "wait" : "pointer", textAlign: "left", width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div style={{ width: "34px", height: "34px", border: "1px solid #E2DACD", borderRadius: "3px", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600 }}>{initialsOf(driver.name)}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600 }}>{driver.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
                        {driver.vehicleLabel ?? "—"} · {driver.bookingsToday}
                      </span>
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span className={tone.live ? "live-badge" : undefined} style={{ width: "6px", height: "6px", borderRadius: "50%", background: tone.color }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: tone.color }}>{statusLabel}</span>
                  </span>
                </button>
              )
            })}

            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
              <button
                type="button"
                onClick={() => setPriceFormOpen((open) => !open)}
                style={{ flex: 1, height: "44px", background: "transparent", border: "1px solid #E2DACD", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
              >
                {t("proposePrice")}
              </button>
              <button
                type="button"
                onClick={onSkip}
                disabled={queue.length < 2}
                style={{ flex: 1, height: "44px", background: "transparent", border: "1px solid #E2DACD", borderRadius: "4px", color: "#6E6A63", fontSize: "13px", fontWeight: 500, cursor: queue.length < 2 ? "default" : "pointer", opacity: queue.length < 2 ? 0.5 : 1 }}
              >
                {t("skip")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
