"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { BookNowIcon } from "@/components/icons/custom-icons";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarBlank, Clock, Users, Bag, Phone, EnvelopeSimple, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle, Warning, ChatCircle, User } from "@phosphor-icons/react";
import { serviceTypes, additionalServices, getServiceById } from "@/lib/services";
import Link from "next/link";

interface FormData {
  serviceType: string;
  customServiceType: string;
  datetime: string;
  pickupAddress: string;
  destinationAddress: string;
  passengers: number;
  customPassengers: string;
  luggage: number;
  customLuggage: string;
  duration: number;
  additionalServices: string[];
  specialRequests: string;
  contactPhone: string;
  // Champs pour les utilisateurs non connectés
  clientName: string;
  clientEmail: string;
}

// Composant interne qui utilise useSearchParams
function ReservationForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignedIn = !!session;
  const isLoaded = status !== "loading";
  const user = session?.user as unknown as { id?: string; name?: string; email?: string; role?: string } | undefined;

  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    serviceType: "",
    customServiceType: "",
    datetime: "",
    pickupAddress: "",
    destinationAddress: "",
    passengers: 1,
    customPassengers: "",
    luggage: 1,
    customLuggage: "",
    duration: 2,
    additionalServices: [],
    specialRequests: "",
    contactPhone: "",
    clientName: "",
    clientEmail: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        if (data.success) {
          setLocations(data.data || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des lieux:", error);
      }
    };
    fetchLocations();
  }, []);

  // Gérer la pré-sélection du formulaire depuis l'URL
  useEffect(() => {
    const serviceParam = searchParams?.get('service');
    const pickupParam = searchParams?.get('pickup');
    const destinationParam = searchParams?.get('destination');
    const datetimeParam = searchParams?.get('datetime');
    const passengersParam = searchParams?.get('passengers');

    setFormData(prev => {
      const newData = { ...prev };

      if (serviceParam && getServiceById(serviceParam)) {
        newData.serviceType = serviceParam;
      }
      if (pickupParam) newData.pickupAddress = pickupParam;
      if (destinationParam) newData.destinationAddress = destinationParam;
      if (datetimeParam) newData.datetime = datetimeParam;
      if (passengersParam) newData.passengers = parseInt(passengersParam, 10) || 1;

      return newData;
    });
  }, [searchParams]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      // Si on change le type de service, réinitialiser le service personnalisé
      if (field === 'serviceType' && value !== 'autres') {
        return { ...prev, [field]: value as string, customServiceType: '' };
      }
      return { ...prev, [field]: value as string | number | boolean | string[] };
    });
  };

  const handleAdditionalServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceId)
        ? prev.additionalServices.filter(id => id !== serviceId)
        : [...prev.additionalServices, serviceId]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Extraire date et time du datetime
      const [date, time] = formData.datetime ? formData.datetime.split('T') : ['', ''];

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: formData.serviceType,
          customServiceType: formData.customServiceType,
          date: date,
          time: time,
          pickupAddress: formData.pickupAddress,
          destinationAddress: formData.destinationAddress,
          passengers: formData.passengers === 11 ? parseInt(formData.customPassengers) || 11 : formData.passengers,
          luggage: formData.luggage === 11 ? parseInt(formData.customLuggage) || 11 : formData.luggage,
          duration: formData.duration,
          additionalServices: formData.additionalServices,
          specialRequests: formData.specialRequests,
          contactPhone: formData.contactPhone,
          contactEmail: formData.clientEmail || user?.email || "",
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          userId: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitting(false);
        setShowSuccessModal(true);
      } else {
        // Ouvre une jolie modale d'erreur au lieu d'un alert natif
        const msg = result.error || 'Erreur lors de la création de la réservation';
        const isForbidden = response.status === 403 || /permission/i.test(msg);
        setErrorModal({
          open: true,
          title: isForbidden ? "Action non autorisée" : "Échec de la réservation",
          message: msg
        });
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setIsSubmitting(false);
      // Si aucune modale n'a été ouverte (erreur réseau, etc.)
      setErrorModal(prev => prev.open ? prev : ({
        open: true,
        title: 'Échec de la réservation',
        message: 'Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.'
      }));
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-center">Chargement...</div>
    </div>;
  }

  return (
    <div className="noise-bg min-h-screen relative overflow-x-hidden" style={{ backgroundColor: 'var(--color-midnight)', fontFamily: 'var(--font-body)' }}>
      <Navigation variant="transparent" />

      {/* Hero Section of Reservation */}
      <div className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-[0.3em] uppercase mb-4 text-gold font-medium"
          >
            Réservation Premium
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl text-white font-display leading-tight mb-6"
          >
            Planifiez votre <span className="text-gold italic">Prochain Voyage</span>
          </motion.h1>
        </div>

        {/* Stepper Logic adapted for 3 steps */}
        <div className="max-w-xl mx-auto mb-16 px-4">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 z-0" />

            {/* Active Progress Line */}
            <motion.div
              className="absolute top-1/2 left-0 h-[2px] bg-gold -translate-y-1/2 z-0 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: (currentStep - 1) / 2 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ width: '100%' }}
            />

            {[1, 2, 3].map((step) => {
              const label = step === 1 ? 'Service' : step === 2 ? 'Détails' : 'Confirmation';
              const isActive = currentStep === step;
              const isPast = currentStep > step;
              const isFuture = currentStep < step;

              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <motion.button
                    onClick={() => isPast && setCurrentStep(step)}
                    disabled={isFuture}
                    whileHover={isPast ? { scale: 1.1 } : {}}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive || isPast
                      ? 'bg-gold text-midnight'
                      : 'bg-obsidian text-text-muted border border-white/10'
                      }`}
                    style={{
                      boxShadow: isActive ? '0 0 20px rgba(201, 168, 76, 0.4)' : 'none'
                    }}
                  >
                    {isPast ? (
                      <CheckCircle size={18} />
                    ) : step}
                  </motion.button>
                  <span className={`absolute -bottom-7 text-[10px] tracking-widest uppercase font-medium whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-gold' : isPast ? 'text-white/70' : 'text-text-muted'
                    }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              {/* Message pour les utilisateurs non connectés */}
              {!isSignedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10 p-6 rounded-2xl glass-card relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-gold/10 transition-colors" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="text-gold" size={24} weight="light" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Réservation Express</h3>
                        <p className="text-text-secondary text-sm">Connectez-vous pour pré-remplir vos informations et suivre vos trajets.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Link href="/auth/signin" className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors text-center">
                        Connexion
                      </Link>
                      <Link href="/auth/signup" className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gold text-midnight text-sm font-bold hover:bg-gold-light transition-colors text-center">
                        Créer un compte
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="glass-card rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-32 translate-x-32 blur-[100px] pointer-events-none" />

                {/* Étape 1: Type de service */}
                {currentStep === 1 && (
                  <div className="space-y-10">
                    <div className="text-center md:text-left">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] tracking-[0.2em] uppercase mb-2 text-gold font-medium"
                      >
                        Étape 1 / 3
                      </motion.p>
                      <h2 className="text-3xl sm:text-4xl text-white font-display mb-4">
                        Choisissez votre <span className="text-gold italic">Service</span>
                      </h2>
                      <p className="text-text-secondary max-w-xl">Sélectionnez le type de prestige qui vous convient pour ce voyage.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {serviceTypes.map((service) => (
                        <motion.div
                          key={service.id}
                          onClick={() => handleInputChange('serviceType', service.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group p-6 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden ${formData.serviceType === service.id
                            ? 'bg-gold/10 border-2 border-gold/50 shadow-[0_0_30px_rgba(201,168,76,0.1)]'
                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                            }`}
                        >
                          {formData.serviceType === service.id && (
                            <motion.div layoutId="activeService" className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-gold text-midnight">
                              <CheckCircle size={14} weight="bold" />
                            </motion.div>
                          )}
                          <div className="flex items-start space-x-5">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-colors duration-300 ${formData.serviceType === service.id ? 'bg-gold text-midnight shadow-[0_4px_15px_rgba(201,168,76,0.3)]' : 'bg-white/5 text-gold'
                              }`}>
                              {service.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-lg transition-colors duration-300 ${formData.serviceType === service.id ? 'text-gold' : 'text-white group-hover:text-gold'
                                }`}>
                                {service.name}
                              </h3>
                              <p className="text-sm text-text-secondary leading-relaxed mt-1 line-clamp-2">{service.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {formData.serviceType === "autres" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4"
                      >
                        <label className="block text-[10px] tracking-widest uppercase mb-3 text-gold font-medium">
                          Précisez votre besoin spécifique
                        </label>
                        <input
                          type="text"
                          value={formData.customServiceType}
                          onChange={(e) => handleInputChange('customServiceType', e.target.value)}
                          placeholder="Ex: Transport événementiel, tournage, etc."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all text-lg"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Étape 2: Détails du trajet */}
                {currentStep === 2 && (
                  <div className="space-y-10">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] tracking-[0.2em] uppercase mb-2 text-gold font-medium">Étape 2 / 3</p>
                      <h2 className="text-3xl sm:text-4xl text-white font-display mb-4">
                        Détails du <span className="text-gold italic">Trajet</span>
                      </h2>
                      <p className="text-text-secondary">Précisez les modalités de votre déplacement.</p>
                    </div>

                    <div className="space-y-8">
                      {/* Infos Client (Guest) */}
                      {!isSignedIn && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                          <div className="space-y-2">
                            <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Nom complet</label>
                            <div className="relative group">
                              <input
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => handleInputChange('clientName', e.target.value)}
                                placeholder="Alpha Oumar Sow"
                                className="w-full bg-midnight/50 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                              />
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" size={18} weight="light" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Email</label>
                            <div className="relative group">
                              <input
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                placeholder="votre@email.com"
                                className="w-full bg-midnight/50 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                              />
                              <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" size={18} weight="light" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Destinations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Lieu de prise en charge</label>
                          <div className="relative group">
                            {locations.length > 0 ? (
                              <select
                                value={formData.pickupAddress}
                                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all appearance-none"
                              >
                                <option value="" disabled className="bg-midnight text-white/50">Sélectionnez un lieu...</option>
                                {locations.map(loc => (
                                  <option key={loc.id} value={loc.name} className="bg-midnight text-white">{loc.name}</option>
                                ))}
                                <option value="Autre" className="bg-midnight text-white">Autre (préciser dans les notes)</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.pickupAddress}
                                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                                placeholder="Aéroport AIBD, Dakar..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                              />
                            )}
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" size={18} weight="light" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Destination finale</label>
                          <div className="relative group">
                            {locations.length > 0 ? (
                              <select
                                value={formData.destinationAddress}
                                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all appearance-none"
                              >
                                <option value="" disabled className="bg-midnight text-white/50">Sélectionnez une destination...</option>
                                {locations.map(loc => (
                                  <option key={loc.id} value={loc.name} className="bg-midnight text-white">{loc.name}</option>
                                ))}
                                <option value="Autre" className="bg-midnight text-white">Autre (préciser dans les notes)</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.destinationAddress}
                                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                                placeholder="Almadies, Hotel Terrou-Bi..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                              />
                            )}
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" size={18} weight="light" />
                          </div>
                        </div>
                      </div>

                      {/* Date, Time, Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Date & Heure</label>
                          <div className="relative group">
                            <input
                              type="datetime-local"
                              value={formData.datetime}
                              onChange={(e) => handleInputChange('datetime', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all [color-scheme:dark]"
                              min={new Date().toISOString().slice(0, 16)}
                            />
                            <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" size={18} weight="light" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Téléphone</label>
                          <div className="relative group">
                            <input
                              type="tel"
                              value={formData.contactPhone}
                              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                              placeholder="+221 77 650 01 02"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" size={18} weight="light" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Passagers & Bagages</label>
                          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                            <div className="flex-1 flex items-center gap-2 px-3 py-3 border-r border-white/5">
                              <Users size={16} weight="light" className="text-gold" />
                              <select
                                value={formData.passengers}
                                onChange={(e) => handleInputChange('passengers', Number(e.target.value))}
                                className="bg-transparent text-white text-sm focus:outline-none w-full"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                                  <option key={n} value={n} className="bg-midnight text-white">{n === 11 ? '10+' : n}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 flex items-center gap-2 px-3 py-3">
                              <Bag size={16} weight="light" className="text-gold" />
                              <select
                                value={formData.luggage}
                                onChange={(e) => handleInputChange('luggage', Number(e.target.value))}
                                className="bg-transparent text-white text-sm focus:outline-none w-full"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                                  <option key={n} value={n} className="bg-midnight text-white">{n === 11 ? '10+' : n}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services Additionnels */}
                      <div className="space-y-4">
                        <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Options de prestige (Facultatif)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {additionalServices.map((service) => (
                            <motion.div
                              key={service.id}
                              onClick={() => handleAdditionalServiceToggle(service.id)}
                              whileTap={{ scale: 0.95 }}
                              className={`p-4 rounded-xl cursor-pointer text-center transition-all duration-300 border ${formData.additionalServices.includes(service.id)
                                ? 'bg-gold text-midnight border-gold font-bold'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                }`}
                            >
                              <span className="text-xs uppercase tracking-tighter">{service.name}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Demandes Spéciales */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-gold font-medium block">Notes particulières</label>
                        <textarea
                          value={formData.specialRequests}
                          onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                          placeholder="Bouteille d'eau pétillante, accueil personnalisé..."
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 3: Confirmation */}
                {currentStep === 3 && (
                  <div className="space-y-10">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] tracking-[0.2em] uppercase mb-2 text-gold font-medium">Étape 3 / 3</p>
                      <h2 className="text-3xl sm:text-4xl text-white font-display mb-4">
                        Finalisez votre <span className="text-gold italic">Expérience</span>
                      </h2>
                      <p className="text-text-secondary">Revoyez les détails de votre réservation avant confirmation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      {/* Recap Card */}
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gold/50" />

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-gold opacity-50">Itinéraire</p>
                          <div className="flex items-start gap-3 mt-4">
                            <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                              <div className="w-2.5 h-2.5 rounded-full border border-gold" />
                              <div className="w-[1px] h-10 bg-white/10" />
                              <MapPin size={16} weight="light" className="text-gold" />
                            </div>
                            <div className="space-y-4 pt-0.5">
                              <div>
                                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-tighter">Départ</p>
                                <p className="text-white font-medium">{formData.pickupAddress || 'Non définie'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-tighter">Arrivée</p>
                                <p className="text-white font-medium">{formData.destinationAddress || 'Non définie'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gold opacity-50 mb-1">Date & Heure</p>
                            <div className="flex items-center gap-2 text-white">
                              <CalendarBlank size={14} weight="light" className="text-gold" />
                              <p className="font-medium text-sm">
                                {formData.datetime ? new Date(formData.datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '--'}
                              </p>
                              <Clock size={14} weight="light" className="text-gold ml-1" />
                              <p className="font-medium text-sm">
                                {formData.datetime ? new Date(formData.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gold opacity-50 mb-1">Type de Service</p>
                            <p className="text-white font-medium text-sm capitalize">
                              {formData.serviceType === "autres" ? formData.customServiceType : (serviceTypes.find(s => s.id === formData.serviceType)?.name || 'Standard')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-white/70">
                              <Users size={14} weight="light" className="text-gold" />
                              <span className="text-xs font-medium">{formData.passengers === 11 ? '10+' : formData.passengers} Pax</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-white/70">
                              <Bag size={14} weight="light" className="text-gold" />
                              <span className="text-xs font-medium">{formData.luggage === 11 ? '10+' : formData.luggage} Sacs</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Sur Devis</span>
                          </div>
                        </div>
                      </div>

                      {/* Info & Action */}
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                              <ShieldCheck size={20} weight="regular" className="text-gold" />
                            </div>
                            <h4 className="text-white font-semibold">Garantie de Service</h4>
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            Votre réservation sera traitée en priorité. Un conseiller Navette Xpress prendra contact avec vous dans un délai de <strong className="text-gold">30 minutes</strong> pour confirmer les détails et le tarif.
                          </p>
                        </div>

                        {formData.specialRequests && (
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <ChatCircle size={14} weight="regular" className="text-gold" />
                              <span className="text-[10px] uppercase tracking-widest text-gold">Requêtes Spéciales</span>
                            </div>
                            <p className="text-xs text-text-muted italic leading-relaxed">"{formData.specialRequests}"</p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                          <Warning size={18} weight="regular" className="text-blue-400 shrink-0" />
                          <p className="text-xs text-blue-200/70 italic">Un SMS de confirmation avec les détails du chauffeur vous sera envoyé une fois le trajet validé.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {currentStep > 1 ? (
                    <motion.button
                      whileHover={{ x: -4 }}
                      onClick={prevStep}
                      className="flex items-center gap-2 text-text-muted hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                    >
                      <ArrowLeft size={16} weight="light" /> Précédent
                    </motion.button>
                  ) : (
                    <button
                      onClick={() => router.push('/')}
                      className="text-text-muted hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {currentStep < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextStep}
                      disabled={
                        (currentStep === 1 && (!formData.serviceType || (formData.serviceType === "autres" && !formData.customServiceType))) ||
                        (currentStep === 2 && (
                          !formData.datetime ||
                          !formData.pickupAddress ||
                          !formData.destinationAddress ||
                          !formData.contactPhone ||
                          (!isSignedIn && (!formData.clientName || !formData.clientEmail))
                        ))
                      }
                      className="lux-button w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 font-bold uppercase tracking-[0.2em] text-sm group text-white"
                    >
                      Suivant
                      <ArrowRight size={18} weight="regular" className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="lux-button w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 font-bold uppercase tracking-[0.2em] text-sm text-white shadow-[0_10px_30px_rgba(201,168,76,0.3)]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                          Confirmation...
                        </>
                      ) : (
                        <>
                          <BookNowIcon size={18} color="currentColor" />
                          Confirmer la Réservation
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Modal de confirmation de succès */}
          <ConfirmationModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="Réservation effectuée !"
            message="Votre réservation a été soumise avec succès. Notre équipe vous contactera dans les plus brefs délais pour confirmer les détails de votre service."
            type="success"
            confirmText="Parfait !"
            onConfirm={() => {
              setShowSuccessModal(false);

              // Rediriger les clients connectés vers leur tableau de bord
              if (isSignedIn && user?.role === 'customer') {
                router.push('/client/dashboard?tab=bookings');
              } else {
                // Pour les utilisateurs non connectés, réinitialiser le formulaire
                setCurrentStep(1);
                setFormData({
                  serviceType: "",
                  customServiceType: "",
                  datetime: "",
                  pickupAddress: "",
                  destinationAddress: "",
                  passengers: 1,
                  customPassengers: "",
                  luggage: 1,
                  customLuggage: "",
                  duration: 2,
                  additionalServices: [],
                  specialRequests: "",
                  contactPhone: "",
                  clientName: "",
                  clientEmail: ""
                });
              }
            }}
          />

          {/* Modal d'erreur stylée */}
          <ConfirmationModal
            isOpen={errorModal.open}
            onClose={() => setErrorModal({ open: false, title: '', message: '' })}
            title={errorModal.title || 'Erreur'}
            message={errorModal.message}
            type="error"
            confirmText="Fermer"
            onConfirm={() => setErrorModal({ open: false, title: '', message: '' })}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Composant principal avec Suspense boundary
export default function ReservationClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
          <p className="text-gold tracking-widest uppercase text-xs font-medium">Initialisation...</p>
        </div>
      </div>
    }>
      <ReservationForm />
    </Suspense>
  );
}


