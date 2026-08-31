"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Users, Bag, ShieldCheck, Pulse, Star, CaretRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

// Client-side vehicle data fetching for the demonstration
async function getVehicles() {
  try {
    const res = await fetch(`/api/vehicles`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

function getVehicleCategory(
  vehicleType: string,
  customCategory: string | null | undefined,
  categoryMap: Record<string, string>,
  fallback: string
) {
  if (customCategory) return customCategory;
  return categoryMap[vehicleType] || fallback;
}

function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    return JSON.parse(features);
  } catch {
    return [];
  }
}

export default function FleetClient() {
  const t = useTranslations("flotte");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoryMap: Record<string, string> = {
      sedan: t("categories.sedan"),
      luxury: t("categories.luxury"),
      suv: t("categories.suv"),
      van: t("categories.van"),
      bus: t("categories.bus"),
    };

    getVehicles().then(data => {
      const mapped = data.map((vehicle: any) => ({
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model}`,
        category: getVehicleCategory(vehicle.vehicleType, vehicle.category, categoryMap, t("categories.default")),
        capacity: vehicle.capacity,
        features: parseFeatures(vehicle.features),
        image: vehicle.photo || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center',
        description: vehicle.description || `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
      }));
      setVehicles(mapped);
      setLoading(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, []);

  const benefits = [
    { icon: <ShieldCheck size={28} weight="light" className="text-gold" />, title: t("benefits.maintenance.title"), desc: t("benefits.maintenance.desc") },
    { icon: <Star size={28} weight="light" className="text-gold" />, title: t("benefits.comfort.title"), desc: t("benefits.comfort.desc") },
    { icon: <Pulse size={28} weight="light" className="text-gold" />, title: t("benefits.connectivity.title"), desc: t("benefits.connectivity.desc") },
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
              {t("hero.titleLine1")} <span className="text-accent">{t("hero.titleLine2")}</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-[#3d3a35] max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </motion.div>
        </section>

        {/* Benefits */}
        <section className="max-w-7xl mx-auto px-6 pb-12 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit, bIndex) => (
              <motion.div
                key={bIndex}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: bIndex * 0.1 }}
                className="bg-white border border-[#e2dacd] rounded-lg p-7 text-center"
              >
                <div className="mb-4 flex justify-center">{benefit.icon}</div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Vehicle Grid */}
        <section className="border-t border-[#e2dacd] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="font-[family-name:var(--font-ibm-plex-mono)] text-sm tracking-[0.16em] uppercase text-text-muted">
                  {t("loading")}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle, vIndex) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: Math.min(vIndex, 6) * 0.05 }}
                    className="group h-full bg-white border border-[#e2dacd] rounded-lg overflow-hidden flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={vehicle.image}
                        alt={vehicle.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded bg-background border border-[#e2dacd] text-gold text-[10px] font-semibold uppercase tracking-[0.1em]">
                        {vehicle.category}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow gap-4">
                      <div className="flex items-center gap-6 text-text-muted text-sm">
                        <div className="flex items-center gap-2">
                          <Users size={16} weight="light" className="text-accent" />
                          <span>{vehicle.capacity} {t("pax")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bag size={16} weight="light" className="text-accent" />
                          <span>{t("luggageIncluded")}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-foreground">
                        {vehicle.name}
                      </h3>

                      <p className="text-sm text-text-muted leading-relaxed flex-grow">
                        {vehicle.description}
                      </p>

                      {vehicle.features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {vehicle.features.slice(0, 3).map((feat: string, fi: number) => (
                            <span key={fi} className="text-[10px] uppercase tracking-wide border border-[#e2dacd] px-2.5 py-1 rounded text-text-muted">
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link
                        href="/reservation"
                        className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded px-6 py-3 text-sm transition-colors"
                      >
                        {t("bookVehicle")}
                        <CaretRight size={16} weight="bold" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="bg-accent">
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-xl md:text-2xl font-semibold text-white">
              {t("cta.titleLine1")} {t("cta.titleLine2")}
            </p>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center bg-background text-foreground px-6 py-3.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("cta.bookNow")}
              </Link>
              <a
                href="tel:+221784651302"
                className="inline-flex items-center justify-center border border-white/40 text-white px-6 py-3.5 rounded font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                {t("cta.fleetAdvisor")}
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
