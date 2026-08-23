"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";

type DotColor = "accent" | "ink" | "gold";
type ZoneKey = "dakar" | "aibd" | "petite-cote";

interface Segment {
  route: string;
  distance: string;
  duree: string;
  berline: number;
  suv: number;
  dot: DotColor;
  zones: ZoneKey[];
}

const segments: Segment[] = [
  { route: "Dakar Plateau → AIBD", distance: "47 km", duree: "55 min", berline: 25000, suv: 42000, dot: "accent", zones: ["dakar"] },
  { route: "Almadies / Ngor → AIBD", distance: "55 km", duree: "1 h 05", berline: 28000, suv: 45000, dot: "accent", zones: ["dakar"] },
  { route: "AIBD → Mbour centre", distance: "32 km", duree: "35 min", berline: 22000, suv: 39000, dot: "ink", zones: ["aibd"] },
  { route: "AIBD → Saly Portudal", distance: "45 km", duree: "40 min", berline: 25000, suv: 42000, dot: "gold", zones: ["aibd", "petite-cote"] },
  { route: "AIBD → La Somone", distance: "52 km", duree: "50 min", berline: 30000, suv: 47000, dot: "gold", zones: ["aibd", "petite-cote"] },
  { route: "Dakar → Saly Portudal", distance: "92 km", duree: "1 h 30", berline: 45000, suv: 62000, dot: "gold", zones: ["dakar", "petite-cote"] },
  { route: "Dakar → Nianing / Joal", distance: "115 km", duree: "1 h 55", berline: 55000, suv: 72000, dot: "gold", zones: ["dakar", "petite-cote"] },
  { route: "Mise à disposition — 10 h / 150 km", distance: "150 km", duree: "journée", berline: 75000, suv: 95000, dot: "ink", zones: [] },
];

const filters: { key: "tous" | ZoneKey; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "dakar", label: "Depuis Dakar" },
  { key: "aibd", label: "Depuis AIBD" },
  { key: "petite-cote", label: "Petite Côte" },
];

const dotClasses: Record<DotColor, string> = {
  accent: "bg-accent",
  ink: "bg-foreground",
  gold: "bg-gold",
};

const formatXof = (n: number) => `${n.toLocaleString("fr-FR")}`;

export default function TarifsClient() {
  const [activeFilter, setActiveFilter] = useState<"tous" | ZoneKey>("tous");

  const filtered =
    activeFilter === "tous" ? segments : segments.filter((s) => s.zones.includes(activeFilter));

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 md:pt-14 md:pb-10">
          <div className="max-w-2xl space-y-5">
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground">
              Le prix de chaque segment, en clair
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35]">
              Tarifs publics en francs CFA, péage et carburant compris, pour une berline. SUV
              +17 000, minibus +33 000. Majoration nocturne de 5 000 entre minuit et cinq heures,
              annoncée à la réservation.
            </p>
          </div>
        </section>

        {/* Filter pills */}
        <section className="max-w-7xl mx-auto px-6 pb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              aria-pressed={activeFilter === f.key}
              className={`font-mono text-xs tracking-[0.12em] uppercase px-4 py-2.5 rounded transition-colors ${
                activeFilter === f.key
                  ? "bg-foreground text-background"
                  : "border border-[#c9c3b8] text-[#3d3a35] hover:border-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </section>

        {/* Pricing table */}
        <section className="max-w-7xl mx-auto px-6 pb-16 md:pb-20">
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr] pb-3 border-b-2 border-foreground font-mono text-[11px] tracking-[0.12em] uppercase text-text-muted">
              <div>Segment</div>
              <div className="text-right">Distance</div>
              <div className="text-right">Durée</div>
              <div className="text-right">Berline</div>
              <div className="text-right">SUV</div>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((seg) => (
                <div
                  key={seg.route}
                  className="grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr] items-center py-[17px]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClasses[seg.dot]}`} />
                    <span className="text-[15px] font-medium text-foreground">{seg.route}</span>
                  </div>
                  <div className="text-right font-mono text-[13px] text-text-muted">
                    {seg.distance.toUpperCase()}
                  </div>
                  <div className="text-right font-mono text-[13px] text-text-muted">
                    {seg.duree.toUpperCase()}
                  </div>
                  <div className="text-right text-[16px] font-semibold text-foreground">
                    {formatXof(seg.berline)}
                  </div>
                  <div className="text-right text-[15px] text-text-muted">
                    {formatXof(seg.suv)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-border border-t-2 border-foreground">
            {filtered.map((seg) => (
              <div key={seg.route} className="flex items-center justify-between py-[15px] gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotClasses[seg.dot]}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{seg.route}</div>
                    <div className="font-mono text-[11px] text-text-muted mt-0.5">
                      {seg.distance.toUpperCase()} · {seg.duree.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-[17px] font-semibold text-foreground shrink-0">
                  {formatXof(seg.berline)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="bg-accent">
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-xl md:text-2xl font-semibold text-white">
              Votre trajet n&rsquo;est pas dans la liste ?
            </p>
            <Link
              href="/quote-request"
              className="inline-flex items-center justify-center bg-background text-foreground px-6 py-3.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Demander un devis
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
