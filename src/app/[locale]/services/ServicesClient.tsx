"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import {
  AirportIcon,
  LuxuryCarIcon,
  PrivateDriverIcon,
  SafetyFirstIcon,
} from "@/components/icons/custom-icons";
import { serviceTypes, type ServiceLocale } from "@/lib/services";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, MapPin, Star, CaretRight, Spinner } from "@phosphor-icons/react";

export default function ServicesClient() {
  const t = useTranslations("services");
  const locale = useLocale() as ServiceLocale;
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from DB
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        if (data.success) {
          setDbServices(data.data || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Locale-aware fallback list (used when the DB has no services yet)
  const localizedServiceTypes = serviceTypes.map((service) => {
    const translation = service.translations[locale] ?? service.translations.fr;
    return {
      id: service.id,
      slug: service.id,
      icon: service.icon,
      name: translation.name,
      description: translation.description,
      features: translation.features,
    };
  });

  // Function to get icon component for each service
  const getServiceIcon = (service: any) => {
    // If it's a known slug, use a custom icon, otherwise default or use icon string
    const iconStr = service.icon || '✈️';
    const slug = service.slug;

    switch (slug) {
      case "transfert-aibd-dakar":
        return <AirportIcon size={40} className="text-gold" />;
      case "chauffeur-prive-dakar":
        return <PrivateDriverIcon size={40} className="text-gold" />;
      case "tours-excursions":
        return <SafetyFirstIcon size={40} className="text-gold" />;
      case "services-vip":
        return <LuxuryCarIcon size={40} className="text-gold" />;
      case "mise-a-disposition":
        return <PrivateDriverIcon size={40} className="text-gold" />;
      default:
        // Render the icon string (emoji) if no custom SVG component
        return <div className="text-4xl">{iconStr}</div>;
    }
  };

  const whyChooseItems = [
    { icon: <ShieldCheck size={24} weight="light" className="text-gold" />, title: t("why.item1.title"), desc: t("why.item1.desc") },
    { icon: <Clock size={24} weight="light" className="text-gold" />, title: t("why.item2.title"), desc: t("why.item2.desc") },
    { icon: <Star size={24} weight="light" className="text-gold" />, title: t("why.item3.title"), desc: t("why.item3.desc") },
    { icon: <MapPin size={24} weight="light" className="text-gold" />, title: t("why.item4.title"), desc: t("why.item4.desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-12 pb-10 md:pt-14 md:pb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground">
              {t("hero.titlePrefix")} <span className="text-accent">{t("hero.titleAccent")}</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-[#3d3a35] max-w-2xl mx-auto leading-relaxed">
              {t("hero.subtitle")}
            </p>
          </motion.div>
        </section>

        {/* Services Grid */}
        <section className="border-t border-[#e2dacd] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <Spinner size={40} className="animate-spin text-accent mb-4" />
                  <p className="text-text-muted tracking-widest uppercase text-xs">{t("grid.loading")}</p>
                </div>
              ) : dbServices.length === 0 && localizedServiceTypes.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-text-muted">{t("grid.empty")}</p>
                </div>
              ) : (
                (dbServices.length > 0 ? dbServices : localizedServiceTypes).map((service: any, index: number) => (
                  <motion.div
                    key={service.slug || service.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05 }}
                    className="h-full bg-white border border-[#e2dacd] rounded-lg p-7 flex flex-col"
                  >
                    <div className="mb-6 p-4 bg-background border border-[#e2dacd] rounded-lg w-fit min-w-16 min-h-16 flex items-center justify-center">
                      {getServiceIcon(service)}
                    </div>

                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {service.name}
                    </h3>

                    <p className="text-text-muted text-sm mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    <ul className="space-y-2.5 mb-8 flex-grow">
                      {(service.features || []).map((feature: string, fIndex: number) => (
                        <li key={fIndex} className="flex items-center gap-3 text-sm text-[#3d3a35]">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/reservation?service=${service.slug || service.id}`}
                      className="inline-flex items-center gap-2 text-accent font-semibold text-sm group"
                    >
                      <span className="border-b border-transparent group-hover:border-accent transition-all duration-300">
                        {t("grid.bookCta")}
                      </span>
                      <CaretRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Comparison Table / Value Prop */}
        <section className="border-t border-[#e2dacd] py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="font-bold text-3xl md:text-4xl mb-4 text-foreground">
                {t("why.titlePrefix")} <span className="text-accent">{t("why.titleAccent")}</span> ?
              </h2>
              <p className="text-text-muted max-w-2xl mx-auto">{t("why.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {whyChooseItems.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 bg-background border border-[#e2dacd] rounded-lg flex items-center justify-center mx-auto mb-5">
                    {item.icon}
                  </div>
                  <h4 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h4>
                  <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-accent">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 text-center">
            <h2 className="text-2xl md:text-4xl font-semibold text-white mb-8">
              {t("finalCta.titleLine1")} {t("finalCta.titleAccent")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center bg-background text-foreground px-8 py-3.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("finalCta.bookCta")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-white/40 text-white px-8 py-3.5 rounded font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                {t("finalCta.contactCta")}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
