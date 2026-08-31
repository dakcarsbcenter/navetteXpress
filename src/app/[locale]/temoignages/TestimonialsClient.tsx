"use client";

import { useTranslations } from "next-intl";
import { Navigation } from "@/components/navigation";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";

interface Testimonial {
  id: number;
  nom: string;
  role: string;
  note: number;
  commentaire: string;
  date: string;
  service: string;
}

export default function TestimonialsClient() {
  const t = useTranslations("temoignages");
  const temoignages = t.raw("testimonials") as Testimonial[];

  const noteGlobale = 4.9;
  const nombreAvis = 1000;

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* SECTION HERO — Note globale + résumé */}
        <section className="py-14 md:py-16 text-center">
          <div className="max-w-3xl mx-auto px-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-accent/10 border border-accent/25">
              <span className="text-accent text-[12px]">✦</span>
              <span className="text-xs tracking-[0.15em] uppercase text-accent font-medium">
                {t("hero.badge")}
              </span>
            </div>

            {/* Titre */}
            <h1 className="font-bold text-4xl sm:text-5xl leading-tight mb-4 text-foreground">
              {t("hero.titleLine1")}{' '}
              <span className="text-accent">{t("hero.titleLine2")}</span>
            </h1>

            <p className="text-base sm:text-lg mb-10 text-text-muted">
              {t("hero.subtitle")}
            </p>

            {/* NOTE GLOBALE — bloc trophée */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-8 px-10 py-8 rounded-lg bg-white border border-[#e2dacd]">

              {/* Note chiffre */}
              <div className="text-center">
                <p className="font-mono text-6xl font-semibold leading-none text-accent">
                  {noteGlobale}
                </p>
                <p className="text-xs uppercase tracking-[0.15em] mt-2 text-text-muted">
                  {t("rating.outOf5")}
                </p>
              </div>

              {/* Séparateur vertical */}
              <div className="hidden sm:block w-px h-16 bg-[#e2dacd]" />

              {/* Étoiles + nb avis */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                        fill={i <= Math.round(noteGlobale) ? '#1F5245' : '#e2dacd'}
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-text-muted">
                  {nombreAvis}+ {t("rating.verifiedReviews")}
                </p>
                <a href="#"
                  className="text-accent text-xs underline underline-offset-2 mt-1 inline-block transition-colors hover:text-foreground">
                  {t("rating.viewOnGoogle")} →
                </a>
              </div>

              {/* Séparateur vertical */}
              <div className="hidden sm:block w-px h-16 bg-[#e2dacd]" />

              {/* Stats rapides */}
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-foreground">
                  98%
                </p>
                <p className="text-xs uppercase tracking-[0.12em] mt-1 text-text-muted">
                  {t("rating.satisfiedCustomers")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION GRILLE TÉMOIGNAGES */}
        <section className="border-t border-[#e2dacd] py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {temoignages.map((temoignage) => (
                <TestimonialCard
                  key={temoignage.id}
                  name={temoignage.nom}
                  role={temoignage.role}
                  content={temoignage.commentaire}
                  rating={temoignage.note}
                  date={temoignage.date}
                  service={temoignage.service}
                  isVerified={true}
                />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION CTA FINAL — "Votre avis compte" */}
        <section className="border-t border-[#e2dacd] py-16 bg-white">
          <div className="max-w-2xl mx-auto px-6 text-center">
            {/* Déco étoiles */}
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                    fill="#1F5245" />
                </svg>
              ))}
            </div>

            <h2 className="font-bold text-3xl sm:text-4xl mb-4 text-foreground">
              {t("cta.titleLine1")}{' '}
              <span className="text-accent">{t("cta.titleLine2")}</span>
            </h2>

            <p className="text-base mb-8 text-text-muted">
              {t("cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href="#"
                target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3.5 rounded font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.32-2.12 4.52-1.36 1.36-3.48 2.84-7.44 2.84-6.4 0-11.6-5.2-11.6-11.6s5.2-11.6 11.6-11.6c3.48 0 6.04 1.36 7.92 3.16l2.32-2.32c-2.12-2.04-4.92-3.64-10.24-3.64-9.48 0-17.24 7.76-17.24 17.24s7.76 17.24 17.24 17.24c5.12 0 9.04-1.68 12.16-4.92 3.24-3.24 4.24-7.76 4.24-11.32 0-.92-.08-1.76-.24-2.52h-16.16z" />
                </svg>
                {t("cta.leaveGoogleReview")}
              </a>

              <a
                href="/reservation"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#e2dacd] text-foreground px-6 py-3.5 rounded font-semibold text-sm hover:bg-background transition-colors"
              >
                {t("cta.bookShuttle")} →
              </a>
            </div>

            <p className="text-xs mt-8 text-text-muted">
              {t("cta.verifiedNote")}
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
