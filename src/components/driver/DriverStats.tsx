"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, Coins, Star, Target } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ContentCard, EmptyState, MetricCard, SectionHeader } from "@/components/driver/shared"

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

  return (
    <div className="space-y-5 pb-20 md:pb-4">
      <SectionHeader
        title="STATISTIQUES"
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedPeriod === period.key
                  ? "border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-(--accent)"
                  : "border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_50%,transparent)] text-(--text-secondary)"
                  }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="Total courses" value={stats.totalRides} badge="Active" />
        <MetricCard icon={Coins} label="Revenus" value={`${Math.round(stats.totalEarnings).toLocaleString("fr-FR")} F`} badge="Stable" iconTone="green" delay={50} />
        <MetricCard icon={Star} label="Note moyenne" value={`${stats.averageRating.toFixed(1)}/5`} badge="Confirmée" delay={100} />
        <MetricCard icon={Target} label="Taux d'acceptation" value={acceptance} badge="Disponible" delay={150} />
      </div>

      <ContentCard title="Évolution des Revenus" indicator="gold">
        {isLoading ? (
          <EmptyState icon={<Coins size={28} />} title="CHARGEMENT" description="Calcul des revenus" />
        ) : revenueLineData.length === 0 ? (
          <EmptyState icon={<Coins size={28} />} title="AUCUNE DONNÉE" description="Pas de revenus sur cette période" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueLineData}>
                <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#f5a623" strokeWidth={3} dot={{ r: 3, fill: "#f5a623" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ContentCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard title="Courses par jour" indicator="gold">
          {ridesBarData.length === 0 ? (
            <EmptyState icon={<BarChart3 size={22} />} title="AUCUNE COURSE" description="Aucune donnée de course disponible" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ridesBarData}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Bar dataKey="value" fill="#f5a623" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ContentCard>

        <ContentCard title="Top Trajets" indicator="green">
          {stats.topRoutes.length === 0 ? (
            <EmptyState icon={<Target size={22} />} title="AUCUN TRAJET" description="Pas assez de données pour afficher un top" />
          ) : (
            <div className="space-y-2">
              {stats.topRoutes.slice(0, 5).map((route, index) => (
                <article key={`${route.from}-${route.to}-${index}`} className="flex items-center justify-between rounded-lg border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_55%,transparent)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-(--text-primary)">{route.from} → {route.to}</p>
                    <p className="text-xs text-(--text-secondary)">{route.count} fois</p>
                  </div>
                  <p className="text-xs font-semibold text-(--accent)">{Math.round(route.avgPrice * route.count).toLocaleString("fr-FR")} F</p>
                </article>
              ))}
            </div>
          )}
        </ContentCard>
      </div>
    </div>
  )
}
