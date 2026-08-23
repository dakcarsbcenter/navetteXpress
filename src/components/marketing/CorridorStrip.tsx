import { Fragment } from "react";

type WaypointColor = "accent" | "ink" | "gold";

interface Waypoint {
  label: string;
  color: WaypointColor;
}

const waypoints: Waypoint[] = [
  { label: "DAKAR", color: "accent" },
  { label: "AIBD", color: "ink" },
  { label: "MBOUR", color: "ink" },
  { label: "PETITE CÔTE", color: "gold" },
];

const dotClasses: Record<WaypointColor, string> = {
  accent: "bg-accent",
  ink: "bg-foreground",
  gold: "bg-gold",
};

/**
 * The recurring "corridor line" motif: a thin filet connecting circular
 * waypoint dots for Dakar / AIBD / Mbour / Petite Côte. Sits right under
 * the header on public marketing pages. Desktop/tablet only — the mobile
 * mockups skip this strip in favor of a leaner header.
 */
export function CorridorStrip() {
  return (
    <div className="hidden md:block border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center">
        {waypoints.map((wp, i) => (
          <Fragment key={wp.label}>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`w-2 h-2 rounded-full ${dotClasses[wp.color]}`} />
              <span className="font-mono text-[11px] tracking-[0.14em] text-foreground">
                {wp.label}
              </span>
            </div>
            {i < waypoints.length - 1 && (
              <span className="flex-1 h-px bg-foreground/70 mx-3.5" aria-hidden="true" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
