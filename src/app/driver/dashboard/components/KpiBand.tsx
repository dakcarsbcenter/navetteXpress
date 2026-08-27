"use client"

interface Kpi {
  value: string
  label: string
  note: string
}

export function KpiBand({ kpis }: { kpis: Kpi[] }) {
  return (
    <section style={{ display: "flex", flexWrap: "wrap", borderTop: "1px solid #E2DACD", borderBottom: "1px solid #E2DACD" }}>
      {kpis.map((kpi) => (
        <div key={kpi.label} style={{ flex: "1 1 168px", minWidth: "168px", padding: "20px 22px", borderRight: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 600, letterSpacing: "-0.01em", color: "#12100E" }}>{kpi.value}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{kpi.label}</span>
          <span style={{ fontSize: "12px", color: "#3d3a35" }}>{kpi.note}</span>
        </div>
      ))}
    </section>
  )
}
