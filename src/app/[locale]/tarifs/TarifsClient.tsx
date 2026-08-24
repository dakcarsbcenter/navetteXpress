"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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

const dotClasses: Record<DotColor, string> = {
  accent: "bg-accent",
  ink: "bg-foreground",
  gold: "bg-gold",
};

const formatXof = (n: number) => `${n.toLocaleString("fr-FR")}`;

export default function TarifsClient() {
  const t = useTranslations("tarifs");
  const [activeFilter, setActiveFilter] = useState<"tous" | ZoneKey>("tous");

  const segments = t.raw("segments") as Segment[];

  const filters: { key: "tous" | ZoneKey; label: string }[] = [
    { key: "tous", label: t("filters.all") },
    { key: "dakar", label: t("filters.fromDakar") },
    { key: "aibd", label: t("filters.fromAibd") },
    { key: "petite-cote", label: t("filters.petiteCote") },
  ];

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
              {t("hero.title")}
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35]">
              {t("hero.subtitle")}
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
              <div>{t("table.segment")}</div>
              <div className="text-right">{t("table.distance")}</div>
              <div className="text-right">{t("table.duration")}</div>
              <div className="text-right">{t("table.sedan")}</div>
              <div className="text-right">{t("table.suv")}</div>
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
              {t("closingCta.title")}
            </p>
            <Link
              href="/quote-request"
              className="inline-flex items-center justify-center bg-background text-foreground px-6 py-3.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              {t("closingCta.cta")}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
