"use client";

import { useEffect, useState, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/Button";
import { trackPageView } from "@/lib/analytics";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AdSlot from "@/components/public/AdSlot";
import {
  ArrowRight,
  UserCircle,
  Van,
  Star,
  CheckCircle,
  ChatCircle,
  Question,
} from "@phosphor-icons/react";

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

export default function HomeClient({ faqs }: HomeClientProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Widget state
  const [bookingService, setBookingService] = useState('transfert-aibd-dakar');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    if (loading || isCarouselHovered) return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth, children } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const firstChild = children[0] as HTMLElement;
          const scrollAmount = firstChild ? firstChild.offsetWidth + 32 : 400; // gap-8 = 32px
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [loading, isCarouselHovered, vehicles]);

  useEffect(() => {
    trackPageView('home');
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');
        const data = await response.json();
        setVehicles(data.data || []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const waypoints = [
    { label: "Dakar", dot: "bg-accent" },
    { label: "AIBD", dot: "bg-foreground", distance: "47 KM" },
    { label: "Mbour", dot: "bg-foreground", distance: "79 KM" },
    { label: "Petite Côte", dot: "bg-gold", distance: "92 KM" },
  ];

  const stats = [
    { value: "15k+", label: "VOYAGES" },
    { value: "4.9/5", label: "NOTE CLIENT" },
    { value: "24/7", label: "SUPPORT" },
  ];

  const differentiators = [
    {
      n: "01",
      title: "Le prix du segment, affiché",
      desc: "Chaque tronçon a son tarif public. Péage et carburant compris, tarification transparente fixée à l'avance, sans surprise ni surcoût.",
    },
    {
      n: "02",
      title: "Suivi de vol sur AIBD",
      desc: "Accueil personnalisé à l'AIBD avec pancarte. Le chauffeur suit votre vol en temps réel et adapte son départ, sans supplément.",
    },
    {
      n: "03",
      title: "Les mêmes chauffeurs",
      desc: "Une équipe fixe sur le corridor, formée au protocole et à la discrétion — pas une plateforme d'inconnus tirés au sort à chaque course.",
    },
  ];

  const segments = [
    { route: "DAKAR → AIBD", price: "25 000", meta: "47 KM · ~55 MIN" },
    { route: "AIBD → SALY", price: "25 000", meta: "45 KM · ~40 MIN" },
    { route: "DAKAR → SALY", price: "45 000", meta: "92 KM · ~1 H 30" },
    { route: "MISE À DISPOSITION", price: "75 000", meta: "JOUR · 10 H · 150 KM" },
  ];

  const featuredVehicles = [
    {
      name: "Mercedes Classe S",
      category: "Luxe Suprême",
      price: "45,000",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800",
      passengers: 3,
      luggage: 2
    },
    {
      name: "Range Rover Vogue",
      category: "Prestige SUV",
      price: "55,000",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800",
      passengers: 4,
      luggage: 3
    },
    {
      name: "Mercedes Classe V",
      category: "Business Van",
      price: "65,000",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
      passengers: 7,
      luggage: 6
    }
  ];

  const testimonials = [
    {
      name: "Jean-Pierre Durand",
      role: "Sénateur",
      content: "Une ponctualité exemplaire et un service d'une discrétion absolue. La référence à Dakar.",
      rating: 5
    },
    {
      name: "Fatou Sow",
      role: "CEO TechAfrica",
      content: "Le confort des véhicules et la courtoisie des chauffeurs font toute la différence pour mes déplacements d'affaires.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-gold/30 selection:text-gold">
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
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.16em] uppercase text-accent"
            >
              Corridor Dakar — AIBD — Petite Côte
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-semibold text-foreground leading-[1.05] tracking-tight"
            >
              Une seule route.<br />Tenue de bout en bout.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#3d3a35] text-lg max-w-lg leading-relaxed"
            >
              Nos chauffeurs font ce trajet tous les jours. Ils savent à quelle heure le péage se charge, où l&apos;on attend à AIBD, et quelle porte de Saly ouvre la nuit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                iconPosition="right"
                onClick={() => router.push('/reservation')}
              >
                Réserver un trajet
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push('/tarifs')}>
                Tarifs par segment
              </Button>
            </motion.div>

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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative h-[320px] md:h-[400px] rounded-lg overflow-hidden border border-[#e2dacd]"
          >
            <Image
              src="/images/Chauffeur-Services-dakar-senegal-navette-xpress.jpg"
              alt="Chauffeur Navette Xpress sur le corridor Dakar — AIBD — Petite Côte"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="object-cover"
            />
          </motion.div>
        </section>

        <AdSlot placement="home_hero" />

        {/* Differentiators */}
        <section className="border-t border-[#e2dacd]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3">
            {differentiators.map((d, i) => (
              <motion.div
                key={d.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`px-6 md:px-10 py-10 flex flex-col gap-3 border-b md:border-b-0 border-[#e2dacd] ${
                  i < differentiators.length - 1 ? 'md:border-r' : ''
                }`}
              >
                <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.14em] text-gold">
                  {d.n}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{d.title}</h3>
                <p className="text-sm text-[#3d3a35] leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <AdSlot placement="home_services" />

        {/* Segments */}
        <section className="border-t border-[#e2dacd] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-4xl font-semibold text-foreground tracking-tight">
                Les segments, un par un
              </h2>
              <Button variant="ghost" onClick={() => router.push('/tarifs')}>
                Voir la grille complète
              </Button>
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
                Hôtels, entreprises, ONG
              </span>
              <h2 className="text-2xl md:text-4xl font-semibold text-background tracking-tight leading-tight">
                Un compte, un interlocuteur, une facture par mois.
              </h2>
              <p className="text-[#9a938a] max-w-md leading-relaxed">
                Vos équipes réservent, nous consolidons. Relevé mensuel détaillé par mission, justificatifs joints, convention signée rapidement.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="border-background text-background hover:bg-background hover:text-foreground"
                  onClick={() => router.push('/entreprises')}
                >
                  Demander une convention
                </Button>
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
                Déjà utilisé par des hôtels et entreprises de la Petite Côte, ainsi que par des organisations installées à Dakar.
              </p>
            </div>
          </div>
        </section>

        {/* Booking Widget */}
        <section className="py-20 md:py-28" id="booking">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground leading-[1.1] tracking-tight">
                  Prêt pour votre trajet ?
                </h2>
                <p className="text-[#3d3a35] text-lg">
                  Réservez maintenant votre transfert aéroport ou votre trajet privé avec une tarification transparente.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-accent" size={20} weight="light" />
                    <span>Attente gratuite à l&apos;aéroport</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-accent" size={20} weight="light" />
                    <span>Annulation gratuite 24h avant</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-accent" size={20} weight="light" />
                    <span>Paiement sécurisé à bord</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white border border-[#e2dacd] rounded-lg p-8 md:p-10">
                  <div className="flex gap-2 mb-8 p-1 bg-background rounded border border-[#e2dacd]">
                    <button
                      onClick={() => setBookingService('transfert-aibd-dakar')}
                      className={`flex-1 py-3 px-6 rounded font-semibold transition-colors ${
                        bookingService === 'transfert-aibd-dakar'
                          ? 'bg-accent text-white'
                          : 'text-foreground hover:bg-[#F0ECE2]'
                      }`}
                    >
                      Transfert AIBD
                    </button>
                    <button
                      onClick={() => setBookingService('chauffeur-prive-dakar')}
                      className={`flex-1 py-3 px-6 rounded font-semibold transition-colors ${
                        bookingService === 'chauffeur-prive-dakar'
                          ? 'bg-accent text-white'
                          : 'text-foreground hover:bg-[#F0ECE2]'
                      }`}
                    >
                      Ville & Régions
                    </button>
                  </div>

                  <div className="p-6 rounded border border-[#e2dacd] bg-background text-center mb-6">
                    <p className="text-[#3d3a35] text-lg">
                      Simplifiez l&apos;organisation de vos déplacements avec Navette Xpress.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={<ArrowRight size={22} weight="regular" />}
                    iconPosition="right"
                    onClick={() => {
                      const queryParams = new URLSearchParams();
                      if (bookingService) queryParams.append('service', bookingService);
                      router.push(`/reservation?${queryParams.toString()}`);
                    }}
                  >
                    Réserver mon trajet
                  </Button>
                </div>
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
                  Notre Flotte
                </h2>
                <p className="text-[#3d3a35] text-lg max-w-xl">
                  Des véhicules d&apos;exception pour des passagers exigeants. Entretien rigoureux et confort absolu.
                </p>
              </div>
              <Button variant="ghost" onClick={() => router.push('/flotte')}>
                Voir tous les véhicules
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="font-[family-name:var(--font-ibm-plex-mono)] text-sm tracking-[0.16em] uppercase text-text-muted">
                  Chargement de la flotte…
                </div>
              </div>
            ) : (
              <div
                ref={carouselRef}
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
                className="flex gap-8 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {(vehicles.length > 0 ? vehicles : featuredVehicles.map((v: any, index) => ({
                  id: index,
                  make: v.name.split(' ')[0],
                  model: v.name.split(' ').slice(1).join(' '),
                  category: v.category,
                  photo: v.image,
                  capacity: v.passengers,
                  price: v.price
                }))).map((vehicle: any, i: number) => (
                  <div
                    key={vehicle.id || i}
                    className="min-w-[85vw] md:min-w-[360px] flex-shrink-0 snap-center rounded-lg bg-white border border-[#e2dacd] flex flex-col overflow-hidden"
                  >
                    <div className="h-56 relative overflow-hidden">
                      <Image
                        src={vehicle.photo || vehicle.image || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800'}
                        alt={`Véhicule Navette Xpress : ${vehicle.make} ${vehicle.model}`}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded bg-background border border-[#e2dacd] text-gold text-[10px] font-semibold uppercase tracking-[0.1em]">
                        {vehicle.category || vehicle.vehicleType || "VIP"}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      <h3 className="text-xl font-semibold text-foreground">{vehicle.make} {vehicle.model}</h3>
                      <div className="flex items-center gap-6 text-text-muted text-sm">
                        <div className="flex items-center gap-2">
                          <UserCircle size={16} weight="light" className="text-accent" />
                          <span>{vehicle.capacity || 4} Pax</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Van size={16} weight="light" className="text-accent" />
                          <span>Bagages inclus</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#e2dacd]">
                        <div>
                          <div className="text-text-muted text-[10px] uppercase tracking-[0.14em] mb-1">Dès</div>
                          {vehicle.price ? (
                            <div className="text-foreground font-semibold text-lg font-[family-name:var(--font-ibm-plex-mono)]">
                              {vehicle.price} <span className="text-xs text-text-muted font-normal">FCFA</span>
                            </div>
                          ) : (
                            <div className="text-foreground font-semibold text-lg">Sur devis</div>
                          )}
                        </div>
                        <Link
                          href="/reservation"
                          className="w-11 h-11 rounded-full border border-[#e2dacd] flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors"
                          aria-label="Réserver ce véhicule"
                        >
                          <ArrowRight size={18} weight="regular" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <AdSlot placement="home_fleet" />

        {/* Testimonials & FAQ */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <h2 className="text-3xl font-semibold text-foreground tracking-tight">Témoignages</h2>
                <div className="space-y-6">
                  {testimonials.map((t, i) => (
                    <div key={i} className="p-6 rounded-lg bg-white border border-[#e2dacd]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={14} weight="fill" className="text-gold" />
                          ))}
                        </div>
                        <ChatCircle className="text-[#c9c3b8]" size={22} weight="thin" />
                      </div>
                      <p className="text-foreground text-base italic mb-5 leading-relaxed">&quot;{t.content}&quot;</p>
                      <div>
                        <div className="text-foreground font-semibold">{t.name}</div>
                        <div className="text-text-muted text-xs uppercase tracking-[0.1em] mt-1">{t.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <h2 className="text-3xl font-semibold text-foreground tracking-tight">Questions fréquentes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
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
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-accent py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="text-background text-2xl md:text-3xl font-semibold tracking-tight">
                Un trajet à préparer ?
              </div>
              <div className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.14em] uppercase text-white/70">
                Disponible 24h/24, 7j/7
              </div>
            </div>
            <button
              onClick={() => router.push('/reservation')}
              className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-3.5 rounded font-semibold text-base hover:bg-background/90 transition-colors shrink-0"
            >
              Réserver maintenant
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
