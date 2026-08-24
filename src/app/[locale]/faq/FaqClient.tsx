"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-midnight text-foreground selection:bg-gold/30">
      <Navigation variant="solid" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gold/5 blur-[120px] -z-10 rounded-full"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-serif text-5xl md:text-7xl mb-8 tracking-tight text-foreground">
            <span className="text-gold italic">{t("hero.titleHighlight")}</span> {t("hero.titleRest")}
          </h1>
          <p className="font-sans text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </motion.div>
      </section>

      {/* FAQ Content */}
      <section className="py-24 px-4 bg-transparent border-y border-border/10">
        <div className="max-w-4xl mx-auto">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-20">
              <h2 className="font-serif text-3xl mb-12 text-center text-foreground">
                {category.title}
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${faqIndex}`];
                  return (
                    <div key={faqIndex} className="bg-surface-2/50 backdrop-blur-xl border border-border rounded-3xl overflow-hidden hover:border-gold/30 transition-all duration-500 mb-6">
                      <button
                        onClick={() => toggleItem(categoryIndex, faqIndex)}
                        className="w-full text-left p-8 focus:outline-none group"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <h3 className="font-serif text-xl text-foreground group-hover:text-gold transition-colors duration-300">
                            {faq.question}
                          </h3>
                          <div className="shrink-0 w-10 h-10 rounded-full bg-midnight/50 border border-border flex items-center justify-center group-hover:border-gold transition-colors">
                            <CaretDown
                              className={`w-5 h-5 text-gold transition-transform duration-500 ${isOpen ? 'rotate-180' : ''
                                }`}
                              weight="regular"
                            />
                          </div>
                        </div>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="px-8 pb-8">
                          <div className="pt-6 border-t border-border">
                            <p className="font-sans text-foreground/60 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gold/5 blur-[150px] -z-10"></div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-6xl mb-12 leading-tight text-foreground">
            {t("cta.titleLine1")} <br />
            <span className="text-gold italic">{t("cta.titleLine2")}</span>
          </h2>
          <p className="font-sans text-xl text-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("cta.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="tel:+221784651302"
              className="px-10 py-5 bg-gold text-[#1A1A1A] font-bold tracking-widest uppercase rounded-full hover:scale-105 transition-all text-sm flex items-center justify-center gap-3"
            >
              <Phone weight="fill" /> +221 78 465 13 02
            </a>
            <a
              href="mailto:contact@navettexpress.com"
              className="px-10 py-5 border border-border text-foreground font-bold tracking-widest uppercase rounded-full hover:bg-surface-2/50 transition-all text-sm flex items-center justify-center gap-3"
            >
              <EnvelopeSimple weight="fill" /> {t("cta.writeUs")}
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
