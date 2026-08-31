"use client"

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react"
import { Car, ClockCountdown, PaperPlaneTilt, Warning } from "@phosphor-icons/react"
import { StatusBadge } from "@/components/shared/StatusBadge"

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

const cardStyle: CSSProperties = { background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }
const cardHeaderStyle: CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid #E2DACD" }
const cardTitleStyle: CSSProperties = { margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }
const monoMutedStyle: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }
const fieldStyle: CSSProperties = { height: "44px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "4px", fontSize: "13.5px", color: "#12100E", background: "#FFFFFF", outline: "none" }

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

  const submitIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.vehicleId) return

    try {
      const response = await fetch("/api/vehicle-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) return

      const newReport = await response.json()
      if (newReport?.success) {
        const issue: VehicleIssue = {
          id: newReport.id,
          title: newReport.title,
          description: newReport.description,
          category: newReport.category,
          severity: newReport.severity,
          status: newReport.status,
          reportedAt: newReport.reportedAt,
          vehicleInfo: newReport.vehicleInfo,
        }
        setReports((current) => [issue, ...current])
      }

      setForm((current) => ({ ...current, title: "", description: "" }))
    } catch (error) {
      console.error("Erreur création incident:", error)
    }
  }

  const vehicle = vehicles[0]
  const lastRevision = reports.find((item) => item.category === "mechanical" || item.category === "electrical")
  const nextControl = new Date()
  nextControl.setDate(nextControl.getDate() + 30)

  const subtitle = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())

  const rows = useMemo(() => reports.slice(0, 8), [reports])

  const metrics = [
    { value: vehicle?.mileage ? `${vehicle.mileage} km` : "-- km", label: "Kilométrage du jour" },
    { value: lastRevision ? new Date(lastRevision.reportedAt).toLocaleDateString("fr-FR") : "--", label: "Dernière révision" },
    { value: nextControl.toLocaleDateString("fr-FR"), label: "Prochain contrôle" },
  ]

  return (
    <div className="flex flex-col gap-7 pb-16 md:pb-0">
      <section className="flex flex-col gap-2">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
          RAPPORT
        </span>
        <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
          Rapport véhicule
        </h2>
        <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>{subtitle}</p>
      </section>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={cardTitleStyle}>Informations véhicule</h3>
        </div>
        {vehicle ? (
          <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
            <div style={{ display: "flex", height: "140px", alignItems: "center", justifyContent: "center", border: "1px solid #E2DACD", borderRadius: "4px", background: "#F7F3EC", color: "#6E6A63" }}>
              <Car size={42} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>Plaque<br /><span style={{ fontSize: "16px", fontWeight: 600, color: "#12100E" }}>{vehicle.plateNumber}</span></p>
              <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>Modèle<br /><span style={{ fontSize: "16px", fontWeight: 600, color: "#12100E" }}>{vehicle.make} {vehicle.model}</span></p>
              <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>Année<br /><span style={{ fontSize: "16px", fontWeight: 600, color: "#12100E" }}>{vehicle.year ?? "--"}</span></p>
              <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>Kilométrage<br /><span style={{ fontSize: "16px", fontWeight: 600, color: "#12100E" }}>{vehicle.mileage ? `${vehicle.mileage} km` : "--"}</span></p>
            </div>
          </div>
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>AUCUN VÉHICULE</p>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6E6A63" }}>Aucun véhicule associé pour le moment</p>
          </div>
        )}
      </div>

      <section style={{ display: "flex", flexWrap: "wrap", borderTop: "1px solid #E2DACD", borderBottom: "1px solid #E2DACD" }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ flex: "1 1 200px", minWidth: "200px", padding: "20px 22px", borderRight: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 600, letterSpacing: "-0.01em", color: "#12100E" }}>{metric.value}</span>
            <span style={monoMutedStyle}>{metric.label}</span>
          </div>
        ))}
      </section>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={cardTitleStyle}>Signaler un incident</h3>
        </div>
        <form className="flex flex-col gap-4 p-6" onSubmit={submitIncident}>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Titre"
              style={fieldStyle}
            />
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              style={fieldStyle}
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
              style={fieldStyle}
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
            style={{ width: "100%", resize: "none", border: "1px solid #E2DACD", borderRadius: "4px", padding: "10px 12px", fontSize: "13.5px", color: "#12100E", outline: "none" }}
          />

          <button
            type="submit"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", alignSelf: "flex-start", height: "48px", padding: "0 20px", background: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            <PaperPlaneTilt size={15} /> Envoyer le signalement
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={cardTitleStyle}>Derniers rapports</h3>
          <span style={monoMutedStyle}>{rows.length} rapport(s)</span>
        </div>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <ClockCountdown size={26} color="#6E6A63" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>CHARGEMENT DES RAPPORTS</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Warning size={26} color="#6E6A63" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>AUCUN RAPPORT</p>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6E6A63" }}>Aucun incident signalé</p>
          </div>
        ) : (
          <div>
            {rows.map((report, index) => (
              <div
                key={report.id}
                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 24px", borderBottom: index < rows.length - 1 ? "1px solid #F0EAE0" : "none" }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</p>
                  <p style={{ margin: "4px 0 0", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
                    {new Date(report.reportedAt).toLocaleDateString("fr-FR")} · {report.vehicleInfo?.plateNumber ?? "—"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <StatusBadge domain="report" value={report.status} audience="driver" live={report.status === "in_progress"} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>{report.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
