"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  AirportIcon,
  LuxuryCarIcon,
  PrivateDriverIcon,
  SafetyFirstIcon,
  BookNowIcon
} from "@/components/icons/custom-icons";
import { serviceTypes } from "@/lib/services";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, MapPin, Star, CaretRight } from "@phosphor-icons/react";

export default function ServicesPage() {
  // Function to get icon component for each service
  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case "transfert-aibd-dakar":
        return <AirportIcon size={48} className="text-gold" />;
      case "transfert-Dakar-AIBD":
        return <LuxuryCarIcon size={48} className="text-gold" />;
      case "chauffeur-prive-dakar":
        return <PrivateDriverIcon size={48} className="text-gold" />;
      case "tours-excursions":
        return <SafetyFirstIcon size={48} className="text-gold" />;
      case "services-vip":
        return <LuxuryCarIcon size={48} className="text-gold" />;
      case "mise-a-disposition":
        return <PrivateDriverIcon size={48} className="text-gold" />;
      default:
        return <AirportIcon size={48} className="text-gold" />;
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white selection:bg-gold/30">
      {/* Noise Background Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url('/noise.png')` }}></div>

      <Navigation variant="transparent" />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-4 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[128px] -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[128px] -z-10 animate-pulse-slow ml-20"></div>

          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight">
                L'Excellence <span className="text-gold italic">en Mouvement</span>
              </h1>
              <p className="font-sans text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-12">
                Découvrez nos solutions de mobilité premium conçues pour répondre à vos exigences les plus élevées au Sénégal.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {serviceTypes.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-gold/30 hover:bg-white/[0.07] transition-all duration-500 overflow-hidden">
                    {/* Background Shine Effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 blur-[64px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="relative z-10">
                      <div className="mb-6 p-4 bg-midnight/50 border border-white/10 rounded-xl w-fit group-hover:scale-110 transition-transform duration-500">
                        {getServiceIcon(service.id)}
                      </div>

                      <h3 className="font-serif text-3xl mb-4 text-white group-hover:text-gold transition-colors duration-300">
                        {service.name}
                      </h3>

                      <p className="font-sans text-white/60 mb-8 leading-relaxed">
                        {service.description}
                      </p>

                      <ul className="space-y-3 mb-10">
                        {service.features?.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-3 text-sm text-white/80">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/reservation?service=${service.id}`}
                        className="flex items-center gap-2 text-gold font-medium group/link"
                      >
                        <span className="border-b border-transparent group-hover/link:border-gold transition-all duration-300">
                          Réserver maintenant
                        </span>
                        <CaretRight size={18} weight="light" className="translate-y-[1px] group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table / Value Prop */}
        <section className="py-24 px-4 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl mb-6">Pourquoi Choisir <span className="text-gold italic">Navette Xpress</span> ?</h2>
              <p className="text-white/60 max-w-2xl mx-auto">L'alliance parfaite de la technologie moderne et de l'hospitalité sénégalaise authentique.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: <ShieldCheck size={24} weight="thin" className="text-gold" />, title: "Sécurité Totale", desc: "Véhicules assurés et suivis par GPS en temps réel." },
                { icon: <Clock size={24} weight="thin" className="text-gold" />, title: "Ponctualité", desc: "Arrivée garantie 15 minutes avant l'heure prévue." },
                { icon: <Star size={24} weight="thin" className="text-gold" />, title: "Expérience VIP", desc: "Eau fraîche, WiFi et presse à bord de chaque véhicule." },
                { icon: <MapPin size={24} weight="thin" className="text-gold" />, title: "Partout au Sénégal", desc: "Des transferts AIBD aux circuits touristiques nationaux." },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {item.icon}
                  </div>
                  <h4 className="font-serif text-xl mb-2">{item.title}</h4>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5 blur-[120px] -z-10 rounded-full scale-150 transform translate-y-1/2"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="font-serif text-5xl md:text-6xl mb-10 leading-tight">
              Prêt pour une Expérience <br />
              <span className="text-gold italic">Inoubliable ?</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/reservation"
                className="group relative inline-flex items-center justify-center px-10 py-5 font-bold tracking-widest text-[#1A1A1A] uppercase overflow-hidden bg-gold rounded-full transition-all hover:scale-105 active:scale-95"
              >
                <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-0 skew-x-12 transition-transform duration-500"></span>
                <span className="relative">Réserver mon trajet</span>
              </Link>
              <Link
                href="/contact"
                className="px-10 py-5 border border-white/20 rounded-full font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
              >
                Nous contacter
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
