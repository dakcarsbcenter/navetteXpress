"use client";

import { useTranslations } from "next-intl";
import { Navigation } from "@/components/navigation";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Footer } from "@/components/footer";

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
    <div className="min-h-screen bg-midnight text-foreground selection:bg-gold/30">
      <Navigation variant="solid" />

      {/* SECTION HERO — Note globale + résumé */}
      <section
        className="relative py-20 sm:py-28 text-center overflow-hidden"
      >
        {/* Halo décoratif doré derrière le contenu */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(155,27,48,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up bg-gold/10 border border-gold/25">
            <span className="text-gold text-[12px]">✦</span>
            <span className="text-xs tracking-[0.15em] uppercase text-gold font-sans">
              {t("hero.badge")}
            </span>
          </div>

          {/* Titre */}
          <h1 className="font-serif text-4xl sm:text-6xl leading-tight mb-4 animate-fade-in-up text-foreground font-normal">
            {t("hero.titleLine1")}{' '}
            <span className="text-gold italic">{t("hero.titleLine2")}</span>
          </h1>

          <p className="font-sans text-base sm:text-lg mb-12 text-foreground/50 animate-fade-in-up delay-100">
            {t("hero.subtitle")}
          </p>

          {/* NOTE GLOBALE — bloc trophée */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-8 px-10 py-8 rounded-3xl animate-scaleIn bg-surface-2/50 backdrop-blur-xl border border-gold/20 shadow-[0_0_60px_rgba(155,27,48,0.08)]">

            {/* Note chiffre */}
            <div className="text-center">
              <p className="font-mono text-7xl font-semibold leading-none text-gold">
                {noteGlobale}
              </p>
              <p className="text-xs uppercase tracking-[0.15em] mt-2 text-foreground/40">
                {t("rating.outOf5")}
              </p>
            </div>

            {/* Séparateur vertical */}
            <div className="hidden sm:block w-px h-16 bg-border" />

            {/* Étoiles + nb avis */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                      fill={i <= Math.round(noteGlobale) ? '#1F5245' : 'rgba(18,59,77,0.2)'}
                    />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-foreground/40">
                {nombreAvis}+ {t("rating.verifiedReviews")}
              </p>
              <a href="#"
                className="text-gold text-xs underline underline-offset-2 mt-1 inline-block transition-colors hover:text-foreground">
                {t("rating.viewOnGoogle")} →
              </a>
            </div>

            {/* Séparateur vertical */}
            <div className="hidden sm:block w-px h-16 bg-border" />

            {/* Stats rapides */}
            <div className="text-center">
              <p className="font-mono text-2xl font-semibold text-foreground">
                98%
              </p>
              <p className="text-xs uppercase tracking-[0.12em] mt-1 text-foreground/40">
                {t("rating.satisfiedCustomers")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION GRILLE TÉMOIGNAGES */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
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
      <section className="py-20 bg-surface-2/30 backdrop-blur-xl border-y border-border/10">
        <div className="max-w-2xl mx-auto px-4 text-center">
          {/* Déco étoiles */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                  fill="var(--color-gold)" />
              </svg>
            ))}
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl mb-4 text-foreground font-normal">
            {t("cta.titleLine1")}{' '}
            <span className="text-gold italic">{t("cta.titleLine2")}</span>
          </h2>

          <p className="font-sans text-base mb-10 text-foreground/50">
            {t("cta.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#"
              target="_blank" rel="noopener noreferrer"
              className="btn-gold w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.32-2.12 4.52-1.36 1.36-3.48 2.84-7.44 2.84-6.4 0-11.6-5.2-11.6-11.6s5.2-11.6 11.6-11.6c3.48 0 6.04 1.36 7.92 3.16l2.32-2.32c-2.12-2.04-4.92-3.64-10.24-3.64-9.48 0-17.24 7.76-17.24 17.24s7.76 17.24 17.24 17.24c5.12 0 9.04-1.68 12.16-4.92 3.24-3.24 4.24-7.76 4.24-11.32 0-.92-.08-1.76-.24-2.52h-16.16z" />
              </svg>
              {t("cta.leaveGoogleReview")}
            </a>

            <a
              href="/reservation"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 border border-border text-foreground/70 hover:bg-surface-2/50"
            >
              {t("cta.bookShuttle")} →
            </a>
          </div>

          <p className="text-xs mt-8 text-foreground/30">
            {t("cta.verifiedNote")}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
