"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Car, Fuel, Gauge, ShieldCheck, Wrench, FileClock, Send } from "lucide-react"
import { ContentCard, DriverStatusBadge, EmptyState, MetricCard, SectionHeader } from "@/components/driver/shared"

interface VehicleReportProps {
  onBack: () => void
}

interface VehicleIssue {
  id: number
  title: string
  description: string
  category: "mechanical" | "electrical" | "bodywork" | "interior" | "other"
  severity: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  reportedAt: string
  vehicleInfo?: {
    make?: string
    model?: string
    plateNumber?: string
    year?: number
  }
}

interface VehicleApiItem {
  id: number
  make: string
  model: string
  plateNumber: string
  year?: number
  mileage?: number
}

export function VehicleReport({ onBack }: VehicleReportProps) {
  const [reports, setReports] = useState<VehicleIssue[]>([])
  const [vehicles, setVehicles] = useState<VehicleApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: "", description: "", category: "mechanical", severity: "medium", vehicleId: "" })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [reportsRes, vehiclesRes] = await Promise.all([fetch("/api/vehicle-reports"), fetch("/api/vehicles")])
        const reportsData = await reportsRes.json()
        const vehiclesData = await vehiclesRes.json()

        if (reportsData?.success) {
          setReports(Array.isArray(reportsData.data) ? reportsData.data : [])
        }

        if (vehiclesData?.success) {
          const loadedVehicles: VehicleApiItem[] = Array.isArray(vehiclesData.data) ? vehiclesData.data : []
          setVehicles(loadedVehicles)
          if (loadedVehicles[0]?.id) {
            setForm((current) => ({ ...current, vehicleId: String(loadedVehicles[0].id) }))
          }
        }
      } catch (error) {
        console.error("Erreur chargement rapport véhicule:", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const submitIncident = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.vehicleId) return

    try {
      const response = await fetch("/api/vehicle-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) return

      const refresh = await fetch("/api/vehicle-reports")
      const refreshData = await refresh.json()
      if (refreshData?.success) {
        setReports(Array.isArray(refreshData.data) ? refreshData.data : [])
      }

      setForm((current) => ({ ...current, title: "", description: "" }))
    } catch (error) {
      console.error("Erreur création incident:", error)
    }
  }

  const vehicle = vehicles[0]
  const incidentsOpen = reports.filter((item) => item.status === "open" || item.status === "in_progress").length
  const lastRevision = reports.find((item) => item.category === "mechanical" || item.category === "electrical")
  const nextControl = new Date()
  nextControl.setDate(nextControl.getDate() + 30)

  const subtitle = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())

  const rows = useMemo(() => reports.slice(0, 8), [reports])

  return (
    <div className="space-y-5 pb-20 md:pb-4">
      <SectionHeader title="RAPPORT VÉHICULE" subtitle={subtitle} />

      <ContentCard title="Informations véhicule" indicator="gold">
        {vehicle ? (
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="flex h-36 items-center justify-center rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_60%,transparent)] text-(--text-muted)">
              <Car size={42} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-(--text-secondary)">Plaque<br /><span className="text-base font-semibold text-(--text-primary)">{vehicle.plateNumber}</span></p>
              <p className="text-sm text-(--text-secondary)">Modèle<br /><span className="text-base font-semibold text-(--text-primary)">{vehicle.make} {vehicle.model}</span></p>
              <p className="text-sm text-(--text-secondary)">Année<br /><span className="text-base font-semibold text-(--text-primary)">{vehicle.year ?? "--"}</span></p>
              <p className="text-sm text-(--text-secondary)">Kilométrage<br /><span className="text-base font-semibold text-(--text-primary)">{vehicle.mileage ? `${vehicle.mileage} km` : "--"}</span></p>
            </div>
          </div>
        ) : (
          <EmptyState icon={<Car size={26} />} title="AUCUN VÉHICULE" description="Aucun véhicule associé pour le moment" />
        )}
      </ContentCard>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Gauge} label="Kilométrage du jour" value={vehicle?.mileage ? `${vehicle.mileage} km` : "-- km"} badge="Stable" />
        <MetricCard icon={Wrench} label="Dernière révision" value={lastRevision ? new Date(lastRevision.reportedAt).toLocaleDateString("fr-FR") : "--"} badge="Confirmée" iconTone="green" delay={50} />
        <MetricCard icon={ShieldCheck} label="Prochain contrôle" value={nextControl.toLocaleDateString("fr-FR")} badge="En attente" delay={100} />
      </div>

      <ContentCard title="Signaler un incident" indicator="gold">
        <form className="space-y-3" onSubmit={submitIncident}>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Titre"
              className="rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
            />
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
            >
              <option value="mechanical">Révision</option>
              <option value="electrical">Électrique</option>
              <option value="bodywork">Carrosserie</option>
              <option value="interior">Intérieur</option>
              <option value="other">Plein</option>
            </select>
            <select
              value={form.severity}
              onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
              className="rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
            >
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={4}
            placeholder="Décrivez l'incident"
            className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
          />

          <button className="inline-flex items-center gap-2 rounded-lg bg-(--accent) px-4 py-2 text-sm font-bold text-black hover:brightness-110">
            <Send size={15} /> Envoyer le signalement
          </button>
        </form>
      </ContentCard>

      <ContentCard title="Derniers rapports" indicator={incidentsOpen > 0 ? 'gold' : 'green'}>
        {loading ? (
          <EmptyState icon={<FileClock size={26} />} title="CHARGEMENT DES RAPPORTS" />
        ) : rows.length === 0 ? (
          <EmptyState icon={<AlertTriangle size={26} />} title="AUCUN RAPPORT" description="Aucun incident signalé" />
        ) : (
          <div className="space-y-2">
            {rows.map((report) => (
              <article key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_55%,transparent)] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-(--text-primary)">{report.title}</p>
                  <p className="text-xs text-(--text-secondary)">
                    {new Date(report.reportedAt).toLocaleDateString('fr-FR')} • {report.vehicleInfo?.plateNumber ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DriverStatusBadge status={report.status === 'open' ? 'En attente' : report.status === 'resolved' ? 'Confirmée' : report.status} />
                  <span className="text-xs text-(--text-muted)">{report.category}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  )
}
