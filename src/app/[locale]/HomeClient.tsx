import { getTranslations } from "next-intl/server";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import AdSlot from "@/components/public/AdSlot";
import { BookingWidget } from "./BookingWidget";
import { FleetShowcase } from "./FleetShowcase";
import { PageViewTracker } from "./PageViewTracker";
import { ArrowRight, CheckCircle, Question, SteeringWheel } from "./home-icons";

interface FaqItem {
  question: string;
  answer: string;
}

interface HomeClientProps {
  faqs: FaqItem[];
}

const stripePattern = {
  backgroundImage: "repeating-linear-gradient(45deg, #E8DCC8 0 10px, #E0D2B9 10px 20px)",
};

// Server Component : seules les 3 zones reellement interactives de la home
// (BookingWidget, FleetShowcase, PageViewTracker) sont hydratees cote
// client. Le reste (textes, sections statiques, CTA de navigation) est
// rendu et livre en HTML pur, ce qui reduit le JS envoye au navigateur.
export default async function HomeClient({ faqs }: HomeClientProps) {
  const t = await getTranslations("home");

  const waypoints = [
    { label: "Dakar", dot: "bg-accent" },
    { label: "AIBD", dot: "bg-foreground", distance: "47 KM" },
    { label: "Mbour", dot: "bg-foreground", distance: "79 KM" },
    { label: "Petite Côte", dot: "bg-gold", distance: "92 KM" },
  ];

  const stats = [
    { value: "15k+", label: t("stats.trips") },
    { value: "4.9/5", label: t("stats.rating") },
    { value: "24/7", label: t("stats.support") },
  ];

  const differentiators = [
    { n: "01", title: t("differentiators.d1.title"), desc: t("differentiators.d1.desc") },
    { n: "02", title: t("differentiators.d2.title"), desc: t("differentiators.d2.desc") },
    { n: "03", title: t("differentiators.d3.title"), desc: t("differentiators.d3.desc") },
  ];

  const segments = [
    { route: t("segments.dakarAibd"), price: "25 000", meta: `47 KM · ~55 MIN` },
    { route: t("segments.aibdSaly"), price: "25 000", meta: `45 KM · ~40 MIN` },
    { route: t("segments.dakarSaly"), price: "45 000", meta: `92 KM · ~1 H 30` },
    { route: t("segments.dayHire"), price: "75 000", meta: `${t("segments.day")} · 10 H · 150 KM` },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-gold/30 selection:text-gold">
      <PageViewTracker page="home" />
      <Navigation variant="transparent" />

      <main className="pt-28 md:pt-36">
        {/* Corridor strip */}
        <div className="border-b border-[#e2dacd]">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center overflow-x-auto">
            {waypoints.map((wp, i) => (
              <div key={wp.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${wp.dot}`} />
                  <span className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.14em] uppercase text-foreground">
                    {wp.label}
                  </span>
                  {wp.distance && (
                    <span className="hidden sm:inline font-[family-name:var(--font-ibm-plex-mono)] text-[11px] text-text-muted">
                      {wp.distance}
                    </span>
                  )}
                </div>
                {i < waypoints.length - 1 && (
                  <span className="flex-1 h-[1.5px] bg-foreground mx-3 min-w-6" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p
              className="animate-fade-in-up font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.16em] uppercase text-accent"
            >
              {t("corridor")}
            </p>

            <h1
              className="animate-fade-in-up text-4xl md:text-6xl font-semibold text-foreground leading-[1.05] tracking-tight"
              style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
            >
              {t("hero.titleLine1")}<br />{t("hero.titleLine2")}
            </h1>

            <p
              className="animate-fade-in-up text-[#3d3a35] text-lg max-w-lg leading-relaxed"
              style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
            >
              {t("hero.subtitle")}
            </p>

            <div
              className="animate-fade-in-up flex flex-wrap gap-3 pt-2"
              style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
            >
              <ButtonLink
                href="/reservation"
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                iconPosition="right"
              >
                {t("hero.bookCta")}
              </ButtonLink>
              <ButtonLink href="/tarifs" variant="outline" size="lg">
                {t("hero.ratesCta")}
              </ButtonLink>
            </div>

            <div className="flex items-center gap-8 pt-6 flex-wrap">
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-center gap-8">
                  {i > 0 && <div className="h-8 w-px bg-[#e2dacd]" />}
                  <div>
                    <div className="text-foreground font-semibold text-2xl font-[family-name:var(--font-ibm-plex-mono)]">
                      {s.value}
                    </div>
                    <div className="text-text-muted text-[11px] uppercase tracking-[0.14em] mt-1">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[320px] md:h-[400px] rounded-lg overflow-hidden border border-[#e2dacd]">
            <Image
              src="/images/Chauffeur-Services-dakar-senegal-navette-xpress.jpg"
              alt={t("hero.imageAlt")}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="object-cover"
            />
          </div>
        </section>

        <AdSlot placement="home_hero" />

        {/* Differentiators */}
        <section className="border-t border-[#e2dacd]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3">
            {differentiators.map((d, i) => (
              <div
                key={d.n}
                className={`animate-fade-in-up px-6 md:px-10 py-10 flex flex-col gap-3 border-b md:border-b-0 border-[#e2dacd] ${
                  i < differentiators.length - 1 ? 'md:border-r' : ''
                }`}
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "backwards" }}
              >
                <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.14em] text-gold">
                  {d.n}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{d.title}</h3>
                <p className="text-sm text-[#3d3a35] leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <AdSlot placement="home_services" />

        {/* Segments */}
        <section className="border-t border-[#e2dacd] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-4xl font-semibold text-foreground tracking-tight">
                {t("segments.heading")}
              </h2>
              <ButtonLink href="/tarifs" variant="ghost">
                {t("segments.viewAll")}
              </ButtonLink>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {segments.map((seg) => (
                <div key={seg.route} className="bg-white border border-[#e2dacd] rounded-lg overflow-hidden">
                  <div className="h-24" style={stripePattern} />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.1em] text-text-muted">
                      {seg.route}
                    </div>
                    <div className="text-xl font-semibold text-foreground tracking-tight">
                      {seg.price}{' '}
                      <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-normal text-text-muted">
                        FCFA
                      </span>
                    </div>
                    <div className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-text-muted">
                      {seg.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hôtels, entreprises, ONG */}
        <section className="bg-foreground py-14 md:py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-4">
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.16em] uppercase text-gold">
                {t("b2b.eyebrow")}
              </span>
              <h2 className="text-2xl md:text-4xl font-semibold text-background tracking-tight leading-tight">
                {t("b2b.title")}
              </h2>
              <p className="text-[#9a938a] max-w-md leading-relaxed">
                {t("b2b.desc")}
              </p>
              <div className="pt-2">
                <ButtonLink
                  href="/entreprises"
                  variant="outline"
                  className="border-background text-background hover:bg-background hover:text-foreground"
                >
                  {t("b2b.cta")}
                </ButtonLink>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-10">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-background font-semibold text-3xl md:text-4xl tracking-tight">
                      {s.value}
                    </div>
                    <div className="text-[#9a938a] text-xs uppercase tracking-[0.14em] mt-2">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-px bg-[#2e2b27]" />
              <p className="text-[#9a938a] leading-relaxed">
                {t("b2b.footnote")}
              </p>
            </div>
          </div>
        </section>

        {/* Devenir chauffeur partenaire */}
        <section className="bg-[#E8DCC8] py-14 md:py-16 border-y border-[#d8d2c7]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-4 max-w-xl">
              <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
                <SteeringWheel size={22} className="text-accent" weight="light" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.16em] uppercase text-accent">
                  {t("driverCta.eyebrow")}
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-tight">
                  {t("driverCta.title")}
                </h2>
                <p className="text-[#3d3a35] leading-relaxed">
                  {t("driverCta.desc")}
                </p>
              </div>
            </div>
            <ButtonLink
              href="/devenir-partenaire"
              variant="primary"
              size="lg"
              className="shrink-0"
              icon={<ArrowRight size={20} />}
              iconPosition="right"
            >
              {t("driverCta.cta")}
            </ButtonLink>
          </div>
        </section>

        {/* Booking Widget */}
        <section className="py-20 md:py-28" id="booking">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground leading-[1.1] tracking-tight">
                  {t("booking.title")}
                </h2>
                <p className="text-[#3d3a35] text-lg">
                  {t("booking.subtitle")}
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-accent" size={20} weight="light" />
                    <span>{t("booking.perk1")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-accent" size={20} weight="light" />
                    <span>{t("booking.perk2")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-accent" size={20} weight="light" />
                    <span>{t("booking.perk3")}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <BookingWidget />
              </div>
            </div>
          </div>
        </section>

        {/* Fleet Showcase */}
        <section className="py-20 md:py-24 border-y border-[#e2dacd]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
                  {t("fleet.title")}
                </h2>
                <p className="text-[#3d3a35] text-lg max-w-xl">
                  {t("fleet.subtitle")}
                </p>
              </div>
              <ButtonLink href="/flotte" variant="ghost">
                {t("fleet.viewAll")}
              </ButtonLink>
            </div>

            <FleetShowcase />
          </div>
        </section>

        <AdSlot placement="home_fleet" />

        {/* FAQ */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="space-y-8">
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">{t("faqHeading")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                {faqs.map((f, i) => (
                  <div key={i} className="py-5 border-t border-[#e2dacd] flex flex-col gap-2">
                    <h3 className="text-foreground font-semibold flex items-start gap-2 text-[15px] leading-snug">
                      <Question className="text-accent shrink-0 mt-0.5" size={16} weight="bold" />
                      {f.question}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-accent py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="text-background text-2xl md:text-3xl font-semibold tracking-tight">
                {t("finalCta.title")}
              </div>
              <div className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.14em] uppercase text-white/70">
                {t("finalCta.availability")}
              </div>
            </div>
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-3.5 rounded font-semibold text-base hover:bg-background/90 transition-colors shrink-0"
            >
              {t("finalCta.cta")}
              <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        </section>
      </main>

      {/* Honeypot anti-scraping : lien volontairement invisible, non lié dans
          la navigation/sitemap. Un vrai visiteur ou crawler SEO ne le suit
          jamais ; seul un scraper qui explore le HTML brut y tombe et se
          fait blacklister (voir src/app/api/internal-catalog/route.ts). */}
      <a
        href="/api/internal-catalog"
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
        rel="nofollow"
      >
        Internal catalog
      </a>

      <Footer />
    </div>
  );
}
