"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { CarProfile, Users, CurrencyDollar, TrendUp, Percent } from "@phosphor-icons/react"
import { toIntlLocale } from "@/lib/intl-locale"
import { COMMISSION_RATE, type CommissionPeriod } from "@/lib/commission"

interface AdminStats {
  globalStats: {
    totalRides: number
    totalEarnings: number
    totalCommission: number
    totalDrivers: number
    completionRate: number
    activeDrivers?: number
  }
  driverStats: Array<{
    driverId: string
    name: string
    email: string
    totalRides: number
    completedRides: number
    totalEarnings: number
    averageRating: number
    completionRate: number
    earningsPerRide: number
  }>
  revenueSeries: Array<{ label: string; date: string; revenue: number; commission: number; rides: number }>
  courseDistribution: Array<{ status: string; label: string; count: number; percentage: number }>
}

const DISTRIBUTION_COLORS = ["#1F5245", "#B4643A", "#6E6A63", "#9B8759"]

const getInitials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

const selectStyle: React.CSSProperties = { height: "38px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E", backgroundColor: "#FFFFFF" }
const monoLabel: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }
const cardStyle: React.CSSProperties = { backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "22px" }

const RATE_PERCENT = Math.round(COMMISSION_RATE * 100)

export function OverviewAnalytics({ period }: { period: CommissionPeriod }) {
  const t = useTranslations("admin.overview.analytics")
  const tStatuses = useTranslations("statuses")
  const intlLocale = toIntlLocale(useLocale())
  const fmt = (n: number) => Math.round(n).toLocaleString(intlLocale)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string>("all")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/admin/stats?period=${period}`)
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        const json = await response.json()
        if (!json.success) throw new Error(json.message || "API")
        if (cancelled) return
        setStats({
          globalStats: json.data.globalMetrics,
          driverStats: json.data.driverStats || [],
          revenueSeries: json.data.revenueSeries || [],
          courseDistribution: json.data.courseDistribution || [],
        })
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err)
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur inconnue")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [period])

  // Le filtre chauffeur s'applique aux KPI et au tableau ; le graphique et le donut restent globaux.
  const filteredStats = useMemo(() => {
    if (!stats) return null
    if (selectedDriverId === "all") return stats
    const driver = stats.driverStats.find(d => d.driverId === selectedDriverId)
    if (!driver) return stats
    return {
      ...stats,
      globalStats: {
        ...stats.globalStats,
        totalRides: driver.totalRides,
        totalEarnings: driver.totalEarnings,
        totalCommission: Math.round(driver.totalEarnings * COMMISSION_RATE),
        totalDrivers: 1,
        activeDrivers: 1,
        completionRate: driver.completionRate,
      },
      driverStats: [driver],
    }
  }, [stats, selectedDriverId])

  const revenueChart = useMemo(() => {
    const series = stats?.revenueSeries || []
    if (series.length === 0) {
      return { grossPath: "", areaPath: "", commissionPath: "", grossPoints: [] as { x: number; y: number }[], commissionPoints: [] as { x: number; y: number }[], labels: [] as string[] }
    }

    const maxRevenue = Math.max(...series.map(p => p.revenue), 1)
    const width = 800
    const topMargin = 20
    const baseline = 220
    const toPoint = (i: number, value: number) => ({
      x: series.length > 1 ? (i / (series.length - 1)) * width : width / 2,
      y: baseline - (value / maxRevenue) * (baseline - topMargin),
    })

    const grossPoints = series.map((p, i) => toPoint(i, p.revenue))
    const commissionPoints = series.map((p, i) => toPoint(i, p.commission))
    const toPath = (pts: { x: number; y: number }[]) => pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")
    const grossPath = toPath(grossPoints)
    const areaPath = `${grossPath} L ${grossPoints[grossPoints.length - 1].x} 250 L ${grossPoints[0].x} 250 Z`

    // Limite le nombre de labels affichés pour éviter le chevauchement
    const maxLabels = 8
    const step = Math.max(1, Math.ceil(series.length / maxLabels))
    const labels = series.filter((_, i) => i % step === 0 || i === series.length - 1).map(p => p.label)

    return { grossPath, areaPath, commissionPath: toPath(commissionPoints), grossPoints, commissionPoints, labels }
  }, [stats])

  const distribution = useMemo(() => stats?.courseDistribution ?? [], [stats])
  const distributionTotal = distribution.reduce((sum, d) => sum + d.count, 0)

  const donutSegments = useMemo(() => {
    const circumference = 251 // 2π×40
    let offset = 0
    return distribution.map((d, i) => {
      const dash = distributionTotal > 0 ? (d.count / distributionTotal) * circumference : 0
      const segment = { ...d, dashArray: `${dash} ${circumference}`, dashOffset: -offset, color: DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length] }
      offset += dash
      return segment
    })
  }, [distribution, distributionTotal])

  const statusLabel = (status: string, fallback: string) =>
    tStatuses.has(`booking.${status}.admin`) ? tStatuses(`booking.${status}.admin`) : fallback

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "16px 20px", borderRadius: "4px", backgroundColor: "rgba(184,73,60,.06)", border: "1px solid rgba(184,73,60,.25)", color: "#B8493C", fontSize: "13px" }}>
        {t("error", { message: error })}
      </div>
    )
  }

  if (!filteredStats) return null

  const g = filteredStats.globalStats
  const kpis = [
    { label: t("kpis.rides"), value: g.totalRides.toLocaleString(intlLocale), icon: CarProfile },
    { label: t("kpis.drivers"), value: `${g.activeDrivers || g.totalDrivers}/${g.totalDrivers}`, icon: Users },
    { label: t("kpis.gross"), value: `${fmt(g.totalEarnings)} F`, icon: CurrencyDollar },
    { label: t("kpis.commission", { rate: RATE_PERCENT }), value: `${fmt(g.totalCommission)} F`, icon: Percent },
    { label: t("kpis.completion"), value: `${g.completionRate.toFixed(1)}%`, icon: TrendUp },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <section style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#1F5245" }}>{t("eyebrow")}</span>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, letterSpacing: "-0.015em", color: "#12100E" }}>{t(`title.${period}`)}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ ...monoLabel, fontWeight: 600, letterSpacing: "0.12em" }}>{t("driverFilter")}</span>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            style={{ ...selectStyle, minWidth: "200px" }}
          >
            <option value="all">{t("allDrivers")}</option>
            {stats?.driverStats.map((driver) => (
              <option key={driver.driverId} value={driver.driverId}>{driver.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", borderTop: "1px solid #E2DACD", borderBottom: "1px solid #E2DACD" }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} style={{ padding: "18px 20px", borderRight: i < kpis.length - 1 ? "1px solid #E2DACD" : "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Icon size={17} weight="fill" style={{ color: "#1F5245" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "23px", fontWeight: 600, letterSpacing: "-0.01em", color: "#12100E" }}>{kpi.value}</span>
              <span style={monoLabel}>{kpi.label}</span>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2" style={cardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#12100E" }}>{t("chart.title", { rate: RATE_PERCENT })}</h3>
            <div className="flex items-center gap-4" style={{ fontSize: "11.5px", color: "#3d3a35" }}>
              <span className="flex items-center gap-2"><span style={{ width: "14px", height: "2px", backgroundColor: "#1F5245" }} />{t("chart.gross")}</span>
              <span className="flex items-center gap-2"><span style={{ width: "14px", height: 0, borderTop: "2px dashed #B4643A" }} />{t("chart.commission")}</span>
            </div>
          </div>
          <div style={{ height: "220px", position: "relative" }}>
            {(stats?.revenueSeries ?? []).some(p => p.revenue > 0) ? (
              <>
                <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                  <path d={revenueChart.areaPath} fill="rgba(31,82,69,.06)" />
                  <path d={revenueChart.grossPath} fill="none" stroke="#1F5245" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d={revenueChart.commissionPath} fill="none" stroke="#B4643A" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="flex justify-between" style={{ marginTop: "12px", fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
                  {revenueChart.labels.map((label, i) => <span key={`${label}-${i}`}>{label}</span>)}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center" style={{ fontSize: "12.5px", color: "#6E6A63" }}>{t("empty")}</div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 20px", fontSize: "13px", fontWeight: 600, color: "#12100E" }}>{t("donut.title")}</h3>
          {donutSegments.length > 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ paddingBottom: "10px" }}>
              <div className="relative" style={{ width: "150px", height: "150px", marginBottom: "20px" }}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F0EAE0" strokeWidth="12" />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.status}
                      cx="50" cy="50" r="40" fill="none"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                      transform="rotate(-90 50 50)"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "19px", fontWeight: 600, color: "#12100E" }}>{g.completionRate.toFixed(0)}%</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6A63" }}>{t("kpis.completion")}</span>
                </div>
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                {donutSegments.map(seg => (
                  <div key={seg.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: seg.color }} />
                      <span style={{ fontSize: "12px", color: "#3d3a35" }}>{statusLabel(seg.status, seg.label)}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#12100E" }}>{seg.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: "220px", fontSize: "12.5px", color: "#6E6A63" }}>{t("empty")}</div>
          )}
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2DACD" }}>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#12100E" }}>{t("table.title")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E2DACD" }}>
                <th style={{ ...monoLabel, padding: "12px 16px", fontWeight: 600 }}>{t("table.driver")}</th>
                <th style={{ ...monoLabel, padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>{t("table.rides")}</th>
                <th style={{ ...monoLabel, padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>{t("table.completion")}</th>
                <th style={{ ...monoLabel, padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>{t("table.gross")}</th>
                <th style={{ ...monoLabel, padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>{t("table.commission")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.driverStats.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "20px 16px", textAlign: "center", fontSize: "12.5px", color: "#6E6A63" }}>{t("empty")}</td></tr>
              )}
              {filteredStats.driverStats.map((driver) => (
                <tr key={driver.driverId} style={{ borderBottom: "1px solid #F0EAE0" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: "30px", height: "30px", borderRadius: "3px", backgroundColor: "rgba(31,82,69,.08)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 600, color: "#1F5245" }}>
                        {getInitials(driver.name || "?")}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: "#12100E" }}>{driver.name}</p>
                        <p style={{ margin: 0, fontSize: "10.5px", color: "#6E6A63" }}>{driver.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#12100E" }}>{driver.totalRides}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-3 justify-center">
                      <div style={{ width: "90px", height: "6px", borderRadius: "2px", backgroundColor: "#F0EAE0", overflow: "hidden" }}>
                        <div style={{ height: "100%", backgroundColor: "#1F5245", width: `${driver.completionRate}%` }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, color: "#12100E" }}>{driver.completionRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: "#12100E" }}>{fmt(driver.totalEarnings)} F</span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: "#B4643A" }}>{fmt(driver.totalEarnings * COMMISSION_RATE)} F</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
