"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { Button } from "@/components/ui/Button";

interface ReleveRow {
  date: string;
  mission: string;
  montant: string;
}

interface Benefit {
  n: string;
  title: string;
  text: string;
}

export default function EntreprisesClient() {
  const t = useTranslations("entreprises");
  const releve = t.raw("releve") as ReleveRow[];
  const benefits = t.raw("benefits") as Benefit[];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-accent">
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground text-pretty">
              {t("hero.title")}
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35] max-w-md">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/quote-request">
                <Button variant="primary" size="lg">
                  {t("hero.ctaConvention")}
                </Button>
              </Link>
              <Link href="/tarifs">
                <Button variant="outline" size="lg">
                  {t("hero.ctaRates")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#d8d2c7] rounded-md p-6 flex flex-col gap-3.5 self-start">
            <p className="font-mono text-[10px] tracking-[0.16em] text-text-muted">
              {t("statement.eyebrow")}
            </p>
            <div className="flex justify-between font-mono text-xs text-text-muted border-b border-border pb-2.5">
              <span>{t("statement.date")}</span>
              <span>{t("statement.mission")}</span>
              <span>{t("statement.amount")}</span>
            </div>
            {releve.map((row) => (
              <div
                key={row.date + row.mission}
                className="flex justify-between font-mono text-xs text-foreground"
              >
                <span className="shrink-0">{row.date}</span>
                <span className="text-text-muted truncate mx-3">{row.mission}</span>
                <span className="shrink-0">{row.montant}</span>
              </div>
            ))}
            <div className="h-px bg-foreground mt-1" />
            <div className="flex justify-between items-baseline">
              <p className="font-mono text-xs text-text-muted">{t("statement.total")}</p>
              <p className="font-bold text-2xl md:text-[26px] text-foreground tracking-tight">
                482 000
              </p>
            </div>
          </div>
        </section>

        {/* Benefits row */}
        <section className="border-t border-border grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {benefits.map((b) => (
            <div key={b.n} className="px-6 md:px-10 py-8 flex flex-col gap-2">
              <p className="font-mono text-[11px] tracking-[0.14em] text-gold">{b.n}</p>
              <h3 className="font-semibold text-lg text-foreground">{b.title}</h3>
              <p className="text-sm leading-relaxed text-[#3d3a35]">{b.text}</p>
            </div>
          ))}
        </section>

        {/* Closing CTA band */}
        <section className="bg-foreground">
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-bold text-2xl md:text-[26px] leading-tight text-background tracking-tight">
                {t("closingCta.title")}
              </p>
              <p className="font-mono text-[13px] leading-relaxed text-[#9a938a]">
                {t("closingCta.subtitle")}
              </p>
            </div>
            <Link
              href="/quote-request"
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
