"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";
import Image from "next/image";
import { CalendarBlank, Users, Bag, ShieldCheck, Pulse, Star, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { LuxuryCarIcon, VanIcon, BookNowIcon } from "@/components/icons/custom-icons";
import { motion } from "framer-motion";

// Helper function to get vehicle icon based on category
function getVehicleIcon(category: string, size: number = 24) {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('van') || categoryLower.includes('minibus') || categoryLower.includes('9')) {
    return <VanIcon size={size} className="text-gold" />;
  } else {
    return <LuxuryCarIcon size={size} className="text-gold" />;
  }
}

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

function getVehicleCategory(vehicleType: string, customCategory?: string | null) {
  if (customCategory) return customCategory;
  const categoryMap: Record<string, string> = {
    'sedan': 'Berline Executive',
    'luxury': 'Grande Berline de Luxe',
    'suv': 'SUV Premium',
    'van': 'Van Business',
    'bus': 'Minibus Prestige',
  };
  return categoryMap[vehicleType] || 'Véhicule d\'Exception';
}

function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    return JSON.parse(features);
  } catch {
    return [];
  }
}

export default function FlottePage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicles().then(data => {
      const mapped = data.map((vehicle: any) => ({
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model}`,
        category: getVehicleCategory(vehicle.vehicleType, vehicle.category),
        capacity: vehicle.capacity,
        features: parseFeatures(vehicle.features),
        image: vehicle.photo || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center',
        description: vehicle.description || `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
      }));
      setVehicles(mapped);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-midnight text-white selection:bg-gold/30">
      {/* Noise Background Offset */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url('/noise.png')` }}></div>

      <Navigation variant="transparent" />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-40 pb-24 px-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-serif text-5xl md:text-7xl mb-8 tracking-tight">
                Une Flotte <span className="text-gold italic">D'Exception</span>
              </h1>
              <p className="font-sans text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Symbole de prestige et de raffinement, notre collection de véhicules est rigoureusement sélectionnée pour vous offrir un confort inégalé lors de vos déplacements.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <ShieldCheck size={32} weight="thin" className="text-gold" />, title: "Entretien Irréprochable", desc: "Inspection quotidienne et maintenance rigoureuse pour une sécurité optimale." },
              { icon: <Star size={32} weight="thin" className="text-gold" />, title: "Confort Absolu", desc: "Climatisation tri-zone, sellerie cuir et suspensions adaptatives." },
              { icon: <Pulse size={32} weight="thin" className="text-gold" />, title: "Connectivité & Services", desc: "WiFi haut débit, rafraîchissements et chargeurs à bord." },
            ].map((benefit, bIndex) => (
              <motion.div
                key={bIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: bIndex * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm"
              >
                <div className="mb-6 flex justify-center">{benefit.icon}</div>
                <h3 className="font-serif text-xl mb-3">{benefit.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Vehicle List */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gold tracking-widest text-xs uppercase">Chargement de la collection...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {vehicles.map((vehicle, vIndex) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: vIndex * 0.1 }}
                    className="group"
                  >
                    <div className="h-full bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:border-gold/30 hover:bg-white/[0.05] transition-all duration-500 flex flex-col">
                      {/* Image Container */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={vehicle.image}
                          alt={vehicle.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute top-6 left-6">
                          <span className="bg-midnight/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                            {vehicle.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-4 text-gold/80">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Users size={14} weight="light" />
                            <span>{vehicle.capacity} Places</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Bag size={14} weight="light" />
                            <span>Bagages inclus</span>
                          </div>
                        </div>

                        <h3 className="font-serif text-3xl mb-4 group-hover:text-gold transition-colors">
                          {vehicle.name}
                        </h3>

                        <p className="text-sm text-white/50 leading-relaxed mb-8 flex-grow">
                          {vehicle.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-8">
                          {vehicle.features.slice(0, 3).map((feat: string, fi: number) => (
                            <span key={fi} className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/70">
                              {feat}
                            </span>
                          ))}
                        </div>

                        <Link
                          href="/reservation"
                          className="w-full flex items-center justify-center gap-2 py-4 border border-gold text-gold font-bold tracking-widest uppercase text-xs rounded-xl hover:bg-gold hover:text-midnight transition-all duration-300"
                        >
                          Réserver ce véhicule
                          <CaretRight size={14} weight="light" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gold/5 blur-[150px] -z-10"></div>

          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-6xl mb-12 leading-tight">
              L'Expérience du Luxe <br />
              <span className="text-gold italic">N'attend que Vous</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/reservation"
                className="px-10 py-5 bg-gold text-[#1A1A1A] font-bold tracking-widest uppercase rounded-full hover:scale-105 transition-all text-sm"
              >
                Réserver Maintenant
              </Link>
              <a
                href="tel:+221781319191"
                className="px-10 py-5 border border-white/20 text-white font-bold tracking-widest uppercase rounded-full hover:bg-white/5 transition-all text-sm"
              >
                Conseiller Flotte
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
