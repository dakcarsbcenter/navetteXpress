"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { Button } from "@/components/ui/Button";

interface Changement {
  eyebrow: string;
  title: string;
  text: string;
}

interface TimelineItem {
  step: string;
  text: string;
}

export default function DiasporaClient() {
  const t = useTranslations("diaspora");
  const changements = t.raw("changements") as Changement[];
  const timeline = t.raw("timeline") as TimelineItem[];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 px-6 md:px-10 py-12 md:py-16">
            <p className="font-mono text-[11px] tracking-[0.16em] text-accent">
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground text-pretty">
              {t("hero.title")}
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35] max-w-md">
              {t("hero.subtitle")}
            </p>
            <div className="pt-1">
              <Link href="/reservation">
                <Button variant="primary" size="lg">
                  {t("hero.cta")}
                </Button>
              </Link>
            </div>
          </div>

          <div
            className="min-h-[220px] md:min-h-[400px] flex items-end p-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #E8DCC8 0px, #E8DCC8 10px, #E0D2B9 10px, #E0D2B9 20px)",
            }}
          >
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#6b6154] bg-background px-2.5 py-2 rounded-[3px]">
              {t("hero.imageCaption")}
            </span>
          </div>
        </section>

        {/* Ce qui change */}
        <section className="border-t border-border px-6 md:px-10 py-11 md:py-12 flex flex-col gap-6 md:gap-7">
          <h2 className="font-bold text-3xl md:text-[34px] leading-[1.15] tracking-tight text-foreground">
            {t("changesHeading")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6">
            {changements.map((c) => (
              <div key={c.eyebrow} className="flex flex-col gap-2.5 pt-4 border-t-2 border-foreground">
                <p className="font-mono text-[11px] tracking-[0.14em] text-text-muted">
                  {c.eyebrow}
                </p>
                <h3 className="font-semibold text-lg text-foreground">{c.title}</h3>
                <p className="text-sm leading-relaxed text-[#3d3a35]">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Séjours longs */}
        <section className="border-t border-border px-6 md:px-10 py-11 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-11">
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl md:text-[30px] leading-[1.15] tracking-tight text-foreground">
              {t("longStays.title")}
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35]">
              {t("longStays.text")}
            </p>
            <div className="flex gap-9 pt-1">
              <div>
                <p className="font-bold text-3xl text-gold tracking-tight">75 000</p>
                <p className="font-mono text-xs text-text-muted pt-1.5">{t("longStays.dayRate")}</p>
              </div>
              <div>
                <p className="font-bold text-3xl text-gold tracking-tight">-15 %</p>
                <p className="font-mono text-xs text-text-muted pt-1.5">{t("longStays.discount")}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#E8DCC8] rounded-md p-6 flex flex-col gap-3.5">
            <p className="font-mono text-[10px] tracking-[0.16em] text-text-muted">
              {t("timelineHeading")}
            </p>
            {timeline.map((tl) => (
              <div key={tl.step} className="flex gap-3.5 items-baseline">
                <span className="font-mono text-[11px] text-accent w-12 shrink-0">{tl.step}</span>
                <span className="text-[15px] leading-relaxed text-[#3d3a35]">{tl.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="bg-accent">
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-bold text-2xl md:text-[28px] leading-tight text-white tracking-tight">
                {t("closingCta.title")}
              </p>
              <p className="font-mono text-[13px] leading-relaxed text-[#a8c4bb]">
                {t("closingCta.subtitle")}
              </p>
            </div>
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center bg-background text-foreground px-7 py-4 rounded font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
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
