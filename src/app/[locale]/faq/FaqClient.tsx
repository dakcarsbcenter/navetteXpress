"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { Link } from "@/i18n/navigation";
import { CaretDown, Phone, EnvelopeSimple } from "@phosphor-icons/react";

interface FaqCategory {
  title: string;
  questions: { question: string; answer: string }[];
}

interface FaqClientProps {
  categories: FaqCategory[];
}

export default function FaqClient({ categories }: FaqClientProps) {
  const t = useTranslations("faq");
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-12 pb-10 md:pt-14 md:pb-14 text-center">
          <div className="animate-fade-in-up">
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground">
              <span className="text-accent">{t("hero.titleHighlight")}</span> {t("hero.titleRest")}
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-body max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="border-t border-line py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            {categories.map((category, categoryIndex) => (
              <Reveal key={categoryIndex} className="mb-14 last:mb-0">
                <h2 className="text-2xl font-bold mb-6 text-foreground">
                  {category.title}
                </h2>

                <div className="space-y-3">
                  {category.questions.map((faq, faqIndex) => {
                    const isOpen = openItems[`${categoryIndex}-${faqIndex}`];
                    return (
                      <div key={faqIndex} className="bg-white border border-line rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleItem(categoryIndex, faqIndex)}
                          aria-expanded={!!isOpen}
                          aria-controls={`faq-${categoryIndex}-${faqIndex}`}
                          className="w-full text-left p-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent group"
                        >
                          <div className="flex items-center justify-between gap-6">
                            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                              {faq.question}
                            </h3>
                            <div className="shrink-0 w-9 h-9 rounded-full bg-background border border-line flex items-center justify-center group-hover:border-accent/40 transition-colors">
                              <CaretDown
                                className={`w-4 h-4 text-accent transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
                                  }`}
                                weight="regular"
                              />
                            </div>
                          </div>
                        </button>

                        {/* grid 0fr -> 1fr : la hauteur s'anime jusqu'a la hauteur reelle du texte (max-h figeait une limite). */}
                        <div
                          id={`faq-${categoryIndex}-${faqIndex}`}
                          inert={!isOpen}
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                          <div className="overflow-hidden">
                          <div className="px-6 pb-6">
                            <div className="pt-4 border-t border-line">
                              <p className="text-text-muted leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Liens utiles avant de reserver (maillage interne). Ce bloc etait rendu
            depuis page.tsx, donc avant la <Navigation> : son <h2> precedait le
            <h1>. Il vit desormais dans le flux, apres les questions. */}
        <section className="border-t border-line py-12 md:py-14">
          <div className="max-w-4xl mx-auto px-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{t("beforeBooking.heading")}</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                { href: "/routes", label: t("beforeBooking.routesHub") },
                { href: "/services", label: t("beforeBooking.servicesHub") },
                { href: "/reservation", label: t("beforeBooking.reservation") },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg border border-line hover:border-accent hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-accent">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 text-center">
            <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">
              {t("cta.titleLine1")} {t("cta.titleLine2")}
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t("cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+221784651302"
                className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-6 py-3.5 rounded font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] duration-150"
              >
                <Phone weight="fill" /> +221 78 465 13 02
              </a>
              <a
                href="mailto:contact@navettexpress.com"
                className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-6 py-3.5 rounded font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                <EnvelopeSimple weight="fill" /> {t("cta.writeUs")}
              </a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
