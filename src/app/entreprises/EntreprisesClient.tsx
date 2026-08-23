"use client";

import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { Button } from "@/components/ui/Button";

const releve = [
  { date: "02.08", mission: "DKR → AIBD · M. FALL", montant: "25 000" },
  { date: "05.08", mission: "AIBD → SALY · MISSION UE", montant: "25 000" },
  { date: "11.08", mission: "JOUR COURSE · DÉLÉGATION", montant: "75 000" },
  { date: "19.08", mission: "DKR → MBOUR · Mme SY", montant: "35 000" },
];

const benefits = [
  {
    n: "01",
    title: "Convention sous 5 jours",
    text: "Grille tarifaire annexée, valable douze mois.",
  },
  {
    n: "02",
    title: "Réservation sans compte",
    text: "Vos collaborateurs appellent ou écrivent, nous rattachons.",
  },
  {
    n: "03",
    title: "Chauffeurs habilités",
    text: "Casier vierge, discrétion contractuelle, anglophones sur demande.",
  },
  {
    n: "04",
    title: "Navettes récurrentes",
    text: "Rotations quotidiennes hôtel–aéroport à tarif dégressif.",
  },
];

export default function EntreprisesClient() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-accent">
              HÔTELS · ENTREPRISES · ONG · MISSIONS DIPLOMATIQUES
            </p>
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground text-pretty">
              Un compte, un interlocuteur, une facture par mois.
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35] max-w-md">
              Vos équipes réservent directement, par téléphone ou par e-mail, sans avancer de
              frais. Nous consolidons tout en fin de mois : relevé par mission, justificatifs
              joints, TVA détaillée.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/quote-request">
                <Button variant="primary" size="lg">
                  Demander une convention
                </Button>
              </Link>
              <Link href="/tarifs">
                <Button variant="outline" size="lg">
                  Grille négociée
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#d8d2c7] rounded-md p-6 flex flex-col gap-3.5 self-start">
            <p className="font-mono text-[10px] tracking-[0.16em] text-text-muted">
              RELEVÉ MENSUEL — EXTRAIT
            </p>
            <div className="flex justify-between font-mono text-xs text-text-muted border-b border-border pb-2.5">
              <span>DATE</span>
              <span>MISSION</span>
              <span>MONTANT</span>
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
              <p className="font-mono text-xs text-text-muted">TOTAL AOÛT · 14 COURSES</p>
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
                Parlons volumes.
              </p>
              <p className="font-mono text-[13px] leading-relaxed text-[#9a938a]">
                RÉPONSE SOUS 24 H OUVRÉES · CONTACT@NAVETTEXPRESS.COM
              </p>
            </div>
            <Link
              href="/quote-request"
              className="inline-flex items-center justify-center bg-background text-foreground px-7 py-4 rounded font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Demander une convention
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
