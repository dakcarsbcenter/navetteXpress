"use client"

import { Airplane } from "@phosphor-icons/react"

const FLIGHT_LIVE_TRACKING_URL = "https://www.skyscanner.fr/vols/arrivees-departs/dss/blaise-diagne-international-arrivees-departs"

// Bandeau de marque : le corridor de service (Dakar - AIBD - Mbour - Saly),
// constant quel que soit le chauffeur ou la course du jour — pas de donnee live ici.
const WAYPOINTS = [
  { label: "Dakar", meta: "", dot: "#1F5245" },
  { label: "AIBD", meta: "47 KM", dot: "#12100E" },
  { label: "Mbour", meta: "79 KM", dot: "#12100E" },
  { label: "Saly", meta: "90 KM", dot: "#12100E" },
]

export function CorridorBanner() {
  return (
    <div style={{ borderBottom: "1px solid #E2DACD", background: "#F7F3EC" }} className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3 md:px-6">
        <div className="flex flex-1 items-center min-w-0">
        {WAYPOINTS.map((wp, index) => (
          <div key={wp.label} style={{ display: "flex", alignItems: "center", flex: index < WAYPOINTS.length - 1 ? 1 : undefined, flexShrink: index < WAYPOINTS.length - 1 ? undefined : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: wp.dot }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#12100E" }}>{wp.label}</span>
              {wp.meta && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em", color: "#6E6A63" }}>{wp.meta}</span>
              )}
            </div>
            {index < WAYPOINTS.length - 1 && (
              <span style={{ flex: 1, minWidth: "24px", height: "1.5px", background: "#12100E", margin: "0 14px" }} />
            )}
          </div>
        ))}
        </div>
        <a
          href={FLIGHT_LIVE_TRACKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1F5245", whiteSpace: "nowrap" }}
        >
          <Airplane size={14} weight="bold" /> Vols en direct
        </a>
      </div>
    </div>
  )
}
