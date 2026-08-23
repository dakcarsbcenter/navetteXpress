"use client";

import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { Button } from "@/components/ui/Button";

const changements = [
  {
    eyebrow: "BAGAGES",
    title: "Cinq valises, ça rentre",
    text: "Dites-nous combien vous êtes et ce que vous ramenez : nous envoyons le véhicule qui convient, pas celui qui reste.",
  },
  {
    eyebrow: "FAMILLE",
    title: "Vous réservez pour eux",
    text: "Le chauffeur appelle la personne qui voyage, pas vous. Vous recevez seulement la confirmation qu'elle est montée.",
  },
  {
    eyebrow: "PAIEMENT",
    title: "Depuis l'étranger",
    text: "Virement international, Wave ou espèces à l'arrivée. Le tarif est fixé à la réservation, sans variation de change.",
  },
];

const timeline = [
  { step: "J-1", text: "Prénom du chauffeur, numéro, modèle et plaque." },
  { step: "H-1", text: "Confirmation qu'il est en route vers l'aéroport." },
  { step: "H+0", text: "Message quand vos proches sont montés dans le véhicule." },
  { step: "FIN", text: "Message d'arrivée à destination." },
];

export default function DiasporaClient() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 px-6 md:px-10 py-12 md:py-16">
            <p className="font-mono text-[11px] tracking-[0.16em] text-accent">
              VOUS RENTREZ AU PAYS
            </p>
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground text-pretty">
              Organisez l&rsquo;arrivée depuis là-bas, arrivez sans y penser.
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35] max-w-md">
              Réservez depuis Paris, Milan ou New York, pour vous ou pour la famille qui arrive.
              Nous confirmons par WhatsApp, en français ou en anglais, et nous acceptons le
              paiement depuis l&rsquo;étranger.
            </p>
            <div className="pt-1">
              <Link href="/reservation">
                <Button variant="primary" size="lg">
                  Organiser mon arrivée
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
              photo — retrouvailles en salle d&rsquo;arrivée AIBD
            </span>
          </div>
        </section>

        {/* Ce qui change */}
        <section className="border-t border-border px-6 md:px-10 py-11 md:py-12 flex flex-col gap-6 md:gap-7">
          <h2 className="font-bold text-3xl md:text-[34px] leading-[1.15] tracking-tight text-foreground">
            Ce qui change quand on arrive de loin
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
              Séjours longs
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#3d3a35]">
              Trois semaines au pays, plusieurs déplacements : mise à disposition à la journée ou
              forfait sur la durée du séjour, avec le même chauffeur du début à la fin.
            </p>
            <div className="flex gap-9 pt-1">
              <div>
                <p className="font-bold text-3xl text-gold tracking-tight">75 000</p>
                <p className="font-mono text-xs text-text-muted pt-1.5">LA JOURNÉE · 10 H</p>
              </div>
              <div>
                <p className="font-bold text-3xl text-gold tracking-tight">-15 %</p>
                <p className="font-mono text-xs text-text-muted pt-1.5">AU-DELÀ DE 5 JOURS</p>
              </div>
            </div>
          </div>

          <div className="bg-[#E8DCC8] rounded-md p-6 flex flex-col gap-3.5">
            <p className="font-mono text-[10px] tracking-[0.16em] text-text-muted">
              CE QUE VOUS RECEVEZ, OÙ QUE VOUS SOYEZ
            </p>
            {timeline.map((t) => (
              <div key={t.step} className="flex gap-3.5 items-baseline">
                <span className="font-mono text-[11px] text-accent w-12 shrink-0">{t.step}</span>
                <span className="text-[15px] leading-relaxed text-[#3d3a35]">{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="bg-accent">
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-bold text-2xl md:text-[28px] leading-tight text-white tracking-tight">
                Quelle date d&rsquo;arrivée ?
              </p>
              <p className="font-mono text-[13px] leading-relaxed text-[#a8c4bb]">
                RÉSERVATION POSSIBLE JUSQU&rsquo;À 6 MOIS À L&rsquo;AVANCE
              </p>
            </div>
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center bg-background text-foreground px-7 py-4 rounded font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Organiser mon arrivée
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
