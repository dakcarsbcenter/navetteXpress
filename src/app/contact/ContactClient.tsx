"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import InteractiveMap from "@/components/ui/InteractiveMap";
import {
  BookNowIcon,
  PhoneIcon,
  EmailIcon,
  LocationIcon,
  ClockIcon
} from "@/components/icons/custom-icons";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneTilt, Phone, EnvelopeSimple, MapPin, Clock, CheckCircle, WarningCircle, CaretRight, Globe, ShieldCheck, Star } from "@phosphor-icons/react";

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          service: formData.service,
          preferredDate: formData.date,
          message: formData.message
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          date: '',
          message: ''
        });
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: <Phone size={24} weight="light" className="text-gold" />,
      title: "Conciergerie 24/7",
      details: "+221 78 131 91 91",
      sub: "Disponible via WhatsApp & Appel Direct",
      link: "tel:+221781319191"
    },
    {
      icon: <EnvelopeSimple size={24} weight="light" className="text-gold" />,
      title: "Email Officiel",
      details: "contact@navettexpress.com",
      sub: "Réponse sous 2 heures garanties",
      link: "mailto:contact@navettexpress.com"
    },
    {
      icon: <MapPin size={24} weight="light" className="text-gold" />,
      title: "Siège Social",
      details: "Avenue Léopold Sédar Senghor",
      sub: "Plateau, Dakar, Sénégal",
      link: "https://maps.google.com"
    }
  ];

  const services = [
    "Transfert Aéroport AIBD Dakar",
    "Transfert Aéroport Thies",
    "Transfert Aéroport Mbour",
    "Chauffeur Privé Dakar",
    "Transport Privé Sénégal",
    "Service VIP",
    "Autre / Devis personnalisé"
  ];

  return (
    <div className="min-h-screen bg-midnight text-foreground selection:bg-gold/30">
      {/* Noise Background Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url('/noise.png')` }}></div>

      <Navigation variant="transparent" />

      <main className="relative z-10">
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
              Nous Sommes <span className="text-gold italic">À Votre Écoute</span>
            </h1>
            <p className="font-sans text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Pour toute demande spécifique ou assistance personnalisée, nos conseillers sont à votre entière disposition 24h/24 et 7j/7.
            </p>
          </motion.div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12">

              {/* Contact Information & Methods */}
              <div className="lg:col-span-5 space-y-8">
                <div className="grid gap-6">
                  {contactMethods.map((method, idx) => (
                    <motion.a
                      key={idx}
                      href={method.link}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-surface-2/50 border border-border rounded-2xl p-6 hover:bg-surface-2/70 hover:border-gold/30 transition-all duration-300"
                    >
                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 bg-midnight/50 border border-border rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          {method.icon}
                        </div>
                        <div>
                          <h4 className="font-serif text-xl mb-1 text-foreground/90">{method.title}</h4>
                          <p className="font-sans text-gold font-medium mb-1 tracking-wide">{method.details}</p>
                          <p className="text-xs text-foreground/40">{method.sub}</p>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {/* Emergency Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-gold/10 border border-gold/30 rounded-3xl p-8 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-3xl -z-10 rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex gap-4 items-center mb-4">
                    <ShieldCheck className="text-gold h-8 w-8" weight="light" />
                    <h3 className="font-serif text-2xl text-gold">Service d'Urgence</h3>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">
                    "Plus qu'un transport, une garantie de sérénité pour vos transferts de dernière minute."
                  </p>
                  <a href="tel:+221781319191" className="flex items-center gap-2 text-gold font-bold uppercase tracking-widest text-xs hover:gap-3 transition-all">
                    Appel Immédiat <CaretRight size={16} weight="light" />
                  </a>
                </motion.div>

                {/* Map Component */}
                <div className="bg-surface-2/50 border border-border rounded-3xl p-4 overflow-hidden aspect-video relative group">
                  <InteractiveMap
                    center={[14.74342, -17.472408]}
                    zoom={15}
                    height="100%"
                    showMarker={true}
                    markerTitle="Siège Navette Xpress"
                    markerDescription="Avenue Léopold Sédar Senghor, Dakar"
                    className="grayscale contrast-[1.2] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 rounded-2xl"
                  />
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-surface-2/50 border border-border rounded-[32px] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <PaperPlaneTilt size={120} weight="thin" />
                  </div>

                  <div className="relative z-10">
                    <h2 className="font-serif text-4xl mb-4 text-foreground">Demande de <span className="text-gold italic">Declamation</span></h2>
                    <p className="text-foreground/50 mb-10 max-w-lg">
                      Remplissez ce formulaire d'exclusivité. Un conseiller personnel vous recontactera avec une proposition sur mesure.
                    </p>

                    <AnimatePresence mode="wait">
                      {submitStatus === 'success' ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-gold/10 border border-gold/30 rounded-2xl p-8 text-center"
                        >
                          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-gold w-8 h-8" weight="regular" />
                          </div>
                          <h3 className="font-serif text-2xl mb-2 text-gold">Message Reçu</h3>
                          <p className="text-foreground/70 mb-6">Votre demande a été transmise à notre service conciergerie. Vous recevrez une réponse sous 2 heures.</p>
                          <button
                            onClick={() => setSubmitStatus('idle')}
                            className="text-gold font-bold uppercase tracking-widest text-xs border-b border-gold pb-1"
                          >
                            Envoyer un autre message
                          </button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 ml-4">Nom de Prestige</label>
                              <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-surface-2/50 border border-border rounded-2xl px-6 py-4 focus:outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all text-sm text-foreground"
                                placeholder="Votre nom complet"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 ml-4">Coordonnées Email</label>
                              <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-surface-2/50 border border-border rounded-2xl px-6 py-4 focus:outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all text-sm text-foreground"
                                placeholder="votre@email.com"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 ml-4">Ligne Directe</label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full bg-surface-2/50 border border-border rounded-2xl px-6 py-4 focus:outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all text-sm text-foreground"
                                placeholder="+221 ..."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 ml-4">Service d'Intérêt</label>
                              <select
                                name="service"
                                required
                                value={formData.service}
                                onChange={handleInputChange}
                                className="w-full bg-surface-2/50 border border-border rounded-2xl px-6 py-4 focus:outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all text-sm appearance-none text-foreground"
                              >
                                <option value="" className="bg-midnight text-foreground">Sélectionner un service</option>
                                {services.map((s) => (
                                  <option key={s} value={s} className="bg-midnight text-foreground">{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 ml-4">Message & Exigences Particulières</label>
                            <textarea
                              name="message"
                              required
                              rows={4}
                              value={formData.message}
                              onChange={handleInputChange}
                              className="w-full bg-surface-2/50 border border-border rounded-2xl px-6 py-4 focus:outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all text-sm resize-none text-foreground"
                              placeholder="Faites-nous part de vos attentes..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group w-full relative h-[64px] bg-gold rounded-2xl overflow-hidden active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <div className="relative flex items-center justify-center gap-3 text-midnight font-bold uppercase tracking-widest text-xs">
                              {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                              ) : (
                                <>
                                  Transmettre ma demande
                                  <CaretRight size={18} weight="light" className="translate-y-[1px]" />
                                </>
                              )}
                            </div>
                          </button>

                          {submitStatus === 'error' && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center text-red-400 text-xs font-medium"
                            >
                              Une erreur est survenue. Veuillez nous contacter par téléphone.
                            </motion.p>
                          )}
                        </form>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Promise Section */}
        <section className="py-24 px-4 bg-surface-2/10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-around gap-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="flex flex-col items-center gap-2">
              <Globe className="h-10 w-10 text-gold" weight="thin" />
              <span className="font-serif text-sm tracking-widest uppercase">Dakar Prestige</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-10 w-10 text-gold" weight="thin" />
              <span className="font-serif text-sm tracking-widest uppercase">Sécurité Garantie</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="h-10 w-10 text-gold" weight="thin" />
              <span className="font-serif text-sm tracking-widest uppercase">Service Excellence</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
