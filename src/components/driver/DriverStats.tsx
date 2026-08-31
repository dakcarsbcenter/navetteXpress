"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface DriverStatsProps {
  onBack: () => void
}

interface StatsData {
  totalRides: number
  totalEarnings: number
  averageRating: number
  completedRides: number
  cancelledRides: number
  monthlyData: { month: string; rides: number; earnings: number }[]
  peakHours: { hour: number; rides: number }[]
  topRoutes: { from: string; to: string; count: number; avgPrice: number }[]
}

const periods = [
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "year", label: "Cette année" },
] as const

const cardStyle: CSSProperties = { background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }
const cardHeaderStyle: CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid #E2DACD" }
const cardTitleStyle: CSSProperties = { margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }
const monoMutedStyle: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }

function EmptyPanel({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{title}</p>
      {description && <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6E6A63" }}>{description}</p>}
    </div>
  )
}

export function DriverStats({ onBack }: DriverStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<(typeof periods)[number]["key"]>("month")
  const [stats, setStats] = useState<StatsData>({
    totalRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    completedRides: 0,
    cancelledRides: 0,
    monthlyData: [],
    peakHours: [],
    topRoutes: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/driver/stats?period=${selectedPeriod}`)
        if (!response.ok) return

        const result = await response.json()
        if (result?.success && result?.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error("Erreur statistiques:", error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [selectedPeriod])

  const acceptance = useMemo(() => {
    const total = stats.totalRides || 1
    return `${Math.round((stats.completedRides / total) * 100)}%`
  }, [stats.completedRides, stats.totalRides])

  const revenueLineData = useMemo(() => {
    if (stats.monthlyData.length > 0) return stats.monthlyData.map((item) => ({ label: item.month, value: item.earnings }))
    return []
  }, [stats.monthlyData])

  const ridesBarData = useMemo(() => {
    if (stats.peakHours.length > 0) {
      return stats.peakHours.map((item) => ({ label: `${item.hour}h`, value: item.rides }))
    }
    return []
  }, [stats.peakHours])

  const subtitle = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())

  const kpis = [
    { value: String(stats.totalRides), label: "Total courses", note: "Sur la période" },
    { value: `${Math.round(stats.totalEarnings).toLocaleString("fr-FR")} F`, label: "Revenus", note: "Sur la période" },
    { value: `${stats.averageRating.toFixed(1)}/5`, label: "Note moyenne", note: "Moyenne clients" },
    { value: acceptance, label: "Taux d'acceptation", note: `${stats.completedRides} course(s) menée(s)` },
  ]

  return (
    <div className="flex flex-col gap-7 pb-16 md:pb-0">
      <section className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
            STATISTIQUES
          </span>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Vos performances
          </h2>
          <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>{subtitle}</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {periods.map((period) => {
            const active = selectedPeriod === period.key
            return (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                style={{
                  height: "34px",
                  padding: "0 14px",
                  borderRadius: "4px",
                  border: active ? "1px solid #12100E" : "1px solid #E2DACD",
                  background: active ? "#12100E" : "#FFFFFF",
                  color: active ? "#F7F3EC" : "#6E6A63",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {period.label}
              </button>
            )
          })}
        </div>
      </section>

      <section style={{ display: "flex", flexWrap: "wrap", borderTop: "1px solid #E2DACD", borderBottom: "1px solid #E2DACD" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ flex: "1 1 168px", minWidth: "168px", padding: "20px 22px", borderRight: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 600, letterSpacing: "-0.01em", color: "#12100E" }}>{kpi.value}</span>
            <span style={monoMutedStyle}>{kpi.label}</span>
            <span style={{ fontSize: "12px", color: "#3d3a35" }}>{kpi.note}</span>
          </div>
        ))}
      </section>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={cardTitleStyle}>Évolution des revenus</h3>
          <span style={monoMutedStyle}>{isLoading ? "Chargement" : `${revenueLineData.length} période(s)`}</span>
        </div>
        {isLoading ? (
          <EmptyPanel title="CHARGEMENT" description="Calcul des revenus" />
        ) : revenueLineData.length === 0 ? (
          <EmptyPanel title="AUCUNE DONNÉE" description="Pas de revenus sur cette période" />
        ) : (
          <div style={{ padding: "20px 24px", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueLineData}>
                <CartesianGrid stroke="#E2DACD" strokeOpacity={0.7} vertical={false} />
                <XAxis dataKey="label" stroke="#6E6A63" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <YAxis stroke="#6E6A63" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#12100E", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="value" stroke="#B4643A" strokeWidth={3} dot={{ r: 3, fill: "#B4643A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Courses par heure</h3>
            <span style={monoMutedStyle}>{ridesBarData.length} tranche(s)</span>
          </div>
          {ridesBarData.length === 0 ? (
            <EmptyPanel title="AUCUNE COURSE" description="Aucune donnée disponible" />
          ) : (
            <div style={{ padding: "20px 24px", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ridesBarData}>
                  <CartesianGrid stroke="#E2DACD" strokeOpacity={0.7} vertical={false} />
                  <XAxis dataKey="label" stroke="#6E6A63" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <YAxis stroke="#6E6A63" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#12100E", fontSize: "12px" }}
                  />
                  <Bar dataKey="value" fill="#B4643A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Top trajets</h3>
            <span style={monoMutedStyle}>{stats.topRoutes.length} trajet(s)</span>
          </div>
          {stats.topRoutes.length === 0 ? (
            <EmptyPanel title="AUCUN TRAJET" description="Pas assez de données pour afficher un top" />
          ) : (
            <div>
              {stats.topRoutes.slice(0, 5).map((route, index) => (
                <div
                  key={`${route.from}-${route.to}-${index}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 24px", borderBottom: index < Math.min(stats.topRoutes.length, 5) - 1 ? "1px solid #F0EAE0" : "none" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {route.from} → {route.to}
                    </p>
                    <p style={{ margin: "4px 0 0", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>{route.count} fois</p>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "#12100E", whiteSpace: "nowrap" }}>
                    {Math.round(route.avgPrice * route.count).toLocaleString("fr-FR")} F
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
