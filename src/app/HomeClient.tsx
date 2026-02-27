"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { trackPageView } from "@/lib/analytics";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, UserCircle, Van, Star, MapPin, Phone, EnvelopeSimple, FacebookLogo, InstagramLogo, AirplaneTakeoff, Clock, Car, ShieldCheck, CheckCircle, CaretRight, ChatCircle, Question } from "@phosphor-icons/react";
import Image from "next/image";
import AdSlot from "@/components/public/AdSlot";

import { useRouter } from "next/navigation";

export default function HomeClient() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Widget state
  const [bookingService, setBookingService] = useState('transfert-aibd-dakar');
  const [bookingPickup, setBookingPickup] = useState('');
  const [bookingDestination, setBookingDestination] = useState('');
  const [bookingDateTime, setBookingDateTime] = useState('');
  const [bookingPassengers, setBookingPassengers] = useState('1');

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

  const services = [
    {
      title: "Transfert Aéroport",
      description: "Accueil personnalisé à l'AIBD avec pancarte. Suivi des vols en temps réel pour une ponctualité absolue.",
      icon: <AirplaneTakeoff className="text-gold" size={32} weight="thin" />,
      link: "/services#airport"
    },
    {
      title: "Chauffeur Privé",
      description: "Mise à disposition pour vos rendez-vous d'affaires ou escapades touristiques avec un service de conciergerie.",
      icon: <UserCircle className="text-gold" size={32} weight="thin" />,
      link: "/services#private"
    },
    {
      title: "Transport de Groupe",
      description: "Vans et minibus premium pour vos délégations, mariages ou sorties en famille en toute élégance.",
      icon: <Van className="text-gold" size={32} weight="thin" />,
      link: "/services#group"
    }
  ];

  const features = [
    {
      title: "Discrétion Absolue",
      description: "Nos chauffeurs sont formés au protocole et garantissent une totale confidentialité.",
      icon: <ShieldCheck className="text-gold" weight="thin" />
    },
    {
      title: "Flotte de Prestige",
      description: "Véhicules récents, climatisés et équipés (Wi-Fi, rafraîchissements).",
      icon: <Star className="text-gold" weight="thin" />
    },
    {
      title: "Prix Garantis",
      description: "Tarification transparente fixée à l'avance, sans surprise ni surcoût.",
      icon: <Star className="text-gold" weight="thin" />
    }
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

  const faqs = [
    { q: "Comment se passe l'accueil à l'aéroport ?", a: "Votre chauffeur vous attend à la sortie des passagers avec une pancarte à votre nom. Il suit votre vol en temps réel." },
    { q: "Quels sont les modes de paiement ?", a: "Vous pouvez payer en ligne lors de la réservation ou directement au chauffeur en espèces ou par carte bancaire." },
    { q: "Puis-je annuler ma réservation ?", a: "Oui, l'annulation est gratuite jusqu'à 24h avant le début de la prestation." }
  ];

  return (
    <div className="min-h-screen bg-midnight font-body selection:bg-gold/30 selection:text-gold selection:text-white overflow-hidden">
      <Navigation variant="transparent" />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[95vh] flex items-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-midnight"></div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.15),transparent_70%)]"
            ></motion.div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(167,59,60,0.1),transparent_70%)]"
            ></motion.div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold tracking-widest uppercase"
                >
                  <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                  L'Excellence à Dakar
                </motion.div>

                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl xl:text-8xl text-white font-display leading-[1.1] tracking-tight"
                  >
                    L'Art de la <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-gold via-white to-gold bg-[length:200%_auto] animate-shimmer">
                      Mobilité Privée
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-text-secondary text-lg md:text-xl max-w-xl leading-relaxed"
                  >
                    Expérimentez le prestige avec Navette Xpress. Transferts aéroport AIBD et chauffeurs privés haut de gamme disponibles 24h/24 au Sénégal.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  <Link
                    href="/reservation"
                    className="px-8 py-4 bg-gold text-midnight rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-[0_0_30px_rgba(201,168,76,0.3)] hover:shadow-[0_0_50px_rgba(201,168,76,0.5)]"
                  >
                    <span>Réserver Maintenant</span>
                    <ArrowRight size={20} weight="regular" />
                  </Link>
                  <Link
                    href="/services"
                    className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all text-center"
                  >
                    Nos Services
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-8 pt-6"
                >
                  <div>
                    <div className="text-white font-bold text-2xl font-mono">15k+</div>
                    <div className="text-text-muted text-xs uppercase tracking-widest mt-1">Voyages</div>
                  </div>
                  <div className="h-8 w-px bg-white/10"></div>
                  <div>
                    <div className="text-white font-bold text-2xl font-mono">4.9/5</div>
                    <div className="text-text-muted text-xs uppercase tracking-widest mt-1">Note Client</div>
                  </div>
                  <div className="h-8 w-px bg-white/10"></div>
                  <div>
                    <div className="text-white font-bold text-2xl font-mono">24/7</div>
                    <div className="text-text-muted text-xs uppercase tracking-widest mt-1">Support</div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="hidden lg:block relative"
              >
                <div className="relative z-10 p-2 rounded-[2.5rem] bg-linear-to-br from-gold/30 to-transparent border border-white/10 backdrop-blur-2xl">
                  <div className="rounded-[2rem] overflow-hidden bg-obsidian">
                    <Image
                      src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200"
                      alt="Véhicule de luxe premium Navette Xpress Dakar"
                      width={1200}
                      height={500}
                      priority
                      className="w-full h-[500px] object-cover opacity-80 hover:scale-110 transition-transform duration-1000"
                    />
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-crimson/20 rounded-full blur-3xl"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Ad Slot: Home Hero */}
        <AdSlot placement="home_hero" />

        {/* Services Section */}
        <section className="py-32 relative bg-midnight overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl text-white font-display mb-6"
              >
                Services d'Exception
              </motion.h2>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "80px" }}
                viewport={{ once: true }}
                className="h-1 bg-gold mx-auto mb-8"
              ></motion.div>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Chaque trajet est une expérience unique, conçue pour votre confort et votre sérénité.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-8 rounded-3xl bg-surface border border-white/5 hover:border-gold/30 transition-all duration-500"
                >
                  <div className="w-16 h-16 rounded-2xl bg-midnight flex items-center justify-center mb-8 border border-white/5 group-hover:bg-gold/10 transition-colors">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl text-white font-display mb-4">{service.title}</h3>
                  <p className="text-text-muted mb-8 group-hover:text-text-secondary transition-colors">
                    {service.description}
                  </p>
                  <Link href={service.link} className="inline-flex items-center gap-2 text-gold font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all">
                    Découvrir <CaretRight size={14} weight="light" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Slot: Home Services */}
        <AdSlot placement="home_services" />

        {/* Why Choose Us */}
        <section className="py-32 relative bg-obsidian">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-6">Pourquoi nous ?</div>
                <h2 className="text-4xl md:text-6xl text-white font-display mb-12 leading-tight">
                  L'Engagement pour un Service <span className="italic text-gold">Impeccable</span>
                </h2>
                <div className="space-y-10">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-6">
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0 border border-gold/20">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl text-white font-display mb-2">{feature.title}</h3>
                        <p className="text-text-muted leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square rounded-[3rem] overflow-hidden border border-white/10">
                  <Image
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200"
                    alt="Chauffeur privé Navette Xpress au service d'un client"
                    width={800}
                    height={800}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                {/* Decorative floating stats */}
                <div className="absolute -bottom-10 -right-10 p-8 rounded-3xl bg-midnight border border-gold/30 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-midnight">
                      <CheckCircle size={32} weight="thin" />
                    </div>
                    <div>
                      <div className="text-gold font-bold text-3xl font-mono">100%</div>
                      <div className="text-white text-xs uppercase tracking-widest font-bold">Satisfaction</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Process Section - High End Flow */}
        <section className="py-32 relative bg-midnight">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl text-white font-display mb-6">Votre Voyage, en <span className="text-gold italic">3 Étapes</span></h2>
              <p className="text-text-muted">Simplicité, Rapidité, Excellence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-gold/20 to-transparent -translate-y-1/2"></div>

              {[
                { step: "01", title: "Réservation", desc: "Choisissez votre trajet et votre véhicule en quelques clics." },
                { step: "02", title: "Confirmation", desc: "Recevez votre confirmation instantanée et les détails du chauffeur." },
                { step: "03", title: "Détente", desc: "Profitez d'un trajet serein dans un confort absolu." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative z-10 text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-2xl bg-obsidian border border-gold/30 flex items-center justify-center mx-auto text-gold font-display text-4xl shadow-[0_0_20px_rgba(201,168,76,0.1)] group-hover:shadow-[0_0_40px_rgba(201,168,76,0.3)] transition-all">
                    {item.step}
                  </div>
                  <h3 className="text-2xl text-white font-display">{item.title}</h3>
                  <p className="text-text-muted max-w-[250px] mx-auto">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Widget Section - The Centerpiece */}
        <section className="py-32 relative bg-midnight" id="booking">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(167,59,60,0.05),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
              <div className="lg:col-span-2 space-y-8">
                <h2 className="text-4xl md:text-6xl text-white font-display leading-[1.1]">
                  Prêt pour l'Exceptionnel ?
                </h2>
                <p className="text-text-secondary text-lg">
                  Réservez maintenant votre transfert aéroport ou votre trajet privé avec une tarification transparente.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-white">
                    <CheckCircle className="text-gold" size={20} weight="light" />
                    <span>Attente gratuite à l'aéroport</span>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <CheckCircle className="text-gold" size={20} weight="light" />
                    <span>Annulation gratuite 24h avant</span>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <CheckCircle className="text-gold" size={20} weight="light" />
                    <span>Paiement sécurisé à bord</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-1 rounded-[2.5rem] bg-linear-to-br from-gold/30 to-white/5 shadow-2xl"
                >
                  <div className="bg-obsidian/90 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-12">
                    <div className="flex gap-4 mb-10 p-1 bg-midnight rounded-xl border border-white/5">
                      <button
                        onClick={() => setBookingService('transfert-aibd-dakar')}
                        className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${bookingService === 'transfert-aibd-dakar' ? 'bg-gold text-midnight' : 'text-white hover:bg-white/5'}`}
                      >
                        Transfert AIBD
                      </button>
                      <button
                        onClick={() => setBookingService('chauffeur-prive-dakar')}
                        className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${bookingService === 'chauffeur-prive-dakar' ? 'bg-gold text-midnight' : 'text-white hover:bg-white/5'}`}
                      >
                        Ville & Régions
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-gold text-xs font-bold uppercase tracking-widest ml-1">Départ</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} weight="light" />
                            <input
                              type="text"
                              value={bookingPickup}
                              onChange={(e) => setBookingPickup(e.target.value)}
                              placeholder="Lieu de prise en charge"
                              className="w-full bg-midnight border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-all font-body"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-gold text-xs font-bold uppercase tracking-widest ml-1">Destination</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} weight="light" />
                            <input
                              type="text"
                              value={bookingDestination}
                              onChange={(e) => setBookingDestination(e.target.value)}
                              placeholder="Lieu d'arrivée"
                              className="w-full bg-midnight border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-all font-body"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-gold text-xs font-bold uppercase tracking-widest ml-1">Date & Heure</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} weight="light" />
                            <input
                              type="datetime-local"
                              value={bookingDateTime}
                              onChange={(e) => setBookingDateTime(e.target.value)}
                              className="w-full bg-midnight border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-all font-body [color-scheme:dark]"
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-gold text-xs font-bold uppercase tracking-widest ml-1">Passagers</label>
                          <div className="relative">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} weight="light" />
                            <select
                              value={bookingPassengers}
                              onChange={(e) => setBookingPassengers(e.target.value)}
                              className="w-full bg-midnight border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-all font-body appearance-none"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <option key={n} value={n}>{n} {n === 1 ? 'Personne' : 'Personnes'}</option>
                              ))}
                              <option value="11">+10 Personnes</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const queryParams = new URLSearchParams();
                          if (bookingService) queryParams.append('service', bookingService);
                          if (bookingPickup) queryParams.append('pickup', bookingPickup);
                          if (bookingDestination) queryParams.append('destination', bookingDestination);
                          if (bookingDateTime) queryParams.append('datetime', bookingDateTime);
                          if (bookingPassengers) queryParams.append('passengers', bookingPassengers);
                          router.push(`/reservation?${queryParams.toString()}`);
                        }}
                        className="w-full py-5 bg-gold text-midnight font-bold text-xl rounded-2xl shadow-[0_10px_40px_rgba(201,168,76,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-8"
                      >
                        Vérifier les Prix & Véhicules
                        <ArrowRight size={24} weight="regular" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Fleet Showcase */}
        <section className="py-32 bg-midnight">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl text-white font-display mb-6"
                >
                  Notre Flotte
                </motion.h2>
                <p className="text-text-secondary text-lg max-w-xl">
                  Des véhicules d'exception pour des passagers exigeants. Entretien rigoureux et confort absolu.
                </p>
              </div>
              <Link href="/flotte" className="text-gold font-bold uppercase tracking-widest text-xs border-b border-gold/30 pb-2 hover:border-gold transition-all">
                Voir tous les véhicules
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredVehicles.map((vehicle, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-[2rem] overflow-hidden bg-surface border border-white/5 hover:border-gold/20 transition-all"
                >
                  <div className="h-64 overflow-hidden relative">
                    <Image
                      src={vehicle.image}
                      alt={`Véhicule Navette Xpress : ${vehicle.name}`}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 px-4 py-1 rounded-full bg-midnight/80 backdrop-blur-md border border-white/10 text-gold text-[10px] font-bold uppercase tracking-widest">
                      {vehicle.category}
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl text-white font-display mb-4">{vehicle.name}</h3>
                    <div className="flex items-center gap-6 mb-8 text-text-muted text-sm">
                      <div className="flex items-center gap-2">
                        <UserCircle size={16} weight="light" className="text-gold" />
                        <span>{vehicle.passengers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Van size={16} weight="light" className="text-gold" />
                        <span>{vehicle.luggage}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Dès</div>
                        <div className="text-white font-bold text-xl font-mono">{vehicle.price} <span className="text-xs text-text-muted font-normal">FCFA</span></div>
                      </div>
                      <Link href="/reservation" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:text-midnight transition-all">
                        <ArrowRight size={20} weight="regular" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Slot: Home Fleet */}
        <AdSlot placement="home_fleet" />

        {/* Testimonials & FAQ */}
        <section className="py-32 bg-obsidian relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
              <div className="space-y-12">
                <h2 className="text-4xl text-white font-display">Témoignages</h2>
                <div className="space-y-8">
                  {testimonials.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="p-8 rounded-3xl bg-midnight border border-white/5 relative"
                    >
                      <ChatCircle className="absolute -top-4 -left-4 text-gold/20" size={48} weight="thin" />
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} weight="fill" className="text-gold" />)}
                      </div>
                      <p className="text-white text-lg italic mb-6 leading-relaxed">"{t.content}"</p>
                      <div>
                        <div className="text-white font-bold">{t.name}</div>
                        <div className="text-gold text-xs uppercase tracking-widest">{t.role}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-12">
                <h2 className="text-4xl text-white font-display">F.A.Q</h2>
                <div className="space-y-6">
                  {faqs.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group p-6 rounded-2xl bg-midnight/50 border border-white/5 hover:border-gold/20 transition-all"
                    >
                      <h3 className="text-white font-bold mb-4 flex items-center gap-3">
                        <Question className="text-gold" size={18} weight="light" />
                        {f.q}
                      </h3>
                      <p className="text-text-muted text-sm leading-relaxed">{f.a}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
