"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Button } from "@/components/ui/Button";
import { BookNowIcon } from "@/components/icons/custom-icons";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarBlank, Clock, Users, Bag, Phone, EnvelopeSimple, ArrowRight, ArrowLeft, CheckCircle, ChatCircle, User } from "@phosphor-icons/react";
import { serviceTypes, additionalServices, getServiceById } from "@/lib/services";
import Link from "next/link";

type LocationOption = { id: string; name: string };

const ROUTES_ALLOWED_NODES = {
  DAKAR: ['DAKAR'],
  AIBD: ['AIBD', 'AEROPORT AIBD', 'AEROPORT INTERNATIONAL BLAISE DIAGNE'],
  MBOUR: ['MBOUR'],
  SALY: ['SALY', 'SALLY', 'SALY PORTUDAL', 'SALLY PORTUDAL'],
  NGAPAROU: ['NGAPAROU'],
  THIES: ['THIES', 'THIÈS'],
  NIANING: ['NIANING'],
  POINTE_SARRENE: ['POINTE SARRENE', 'POINTE SARENE', 'POINTE SARENNE'],
  SOMONE: ['SOMONE'],
} as const;

const ROUTES_LOCATION_FALLBACK: LocationOption[] = [
  { id: 'dakar', name: 'DAKAR' },
  { id: 'aibd', name: 'AEROPORT AIBD' },
  { id: 'mbour', name: 'MBOUR' },
  { id: 'saly', name: 'SALY PORTUDAL' },
  { id: 'ngaparou', name: 'NGAPAROU' },
  { id: 'thies', name: 'THIES' },
  { id: 'nianing', name: 'NIANING' },
  { id: 'pointe-sarrene', name: 'POINTE SARRENE' },
  { id: 'somone', name: 'SOMONE' },
];

const normalizeLocationName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const getRouteNodeFromName = (name: string): keyof typeof ROUTES_ALLOWED_NODES | null => {
  const normalized = normalizeLocationName(name);
  const entries = Object.entries(ROUTES_ALLOWED_NODES) as [keyof typeof ROUTES_ALLOWED_NODES, readonly string[]][];
  for (const [node, aliases] of entries) {
    if (aliases.some((alias) => normalizeLocationName(alias) === normalized)) {
      return node;
    }
  }
  return null;
};

const ROUTES_ALLOWED_PAIRS = new Set<string>([
  'DAKAR|AIBD',
  'AIBD|DAKAR',
  'DAKAR|MBOUR',
  'MBOUR|DAKAR',
  'DAKAR|SALY',
  'SALY|DAKAR',
  'DAKAR|NGAPAROU',
  'NGAPAROU|DAKAR',
  'DAKAR|THIES',
  'THIES|DAKAR',
  'DAKAR|NIANING',
  'NIANING|DAKAR',
  'DAKAR|POINTE_SARRENE',
  'POINTE_SARRENE|DAKAR',
  'DAKAR|SOMONE',
  'SOMONE|DAKAR',
]);

const isRouteCombinationAllowed = (pickup: string, destination: string): boolean => {
  const pickupNode = getRouteNodeFromName(pickup);
  const destinationNode = getRouteNodeFromName(destination);
  if (!pickupNode || !destinationNode) {
    return false;
  }
  return ROUTES_ALLOWED_PAIRS.has(`${pickupNode}|${destinationNode}`);
};

const toAllowedRouteLocations = (locations: LocationOption[]): LocationOption[] => {
  const filtered = locations.filter((loc) => Boolean(getRouteNodeFromName(loc.name)));
  if (filtered.length === 0) {
    return ROUTES_LOCATION_FALLBACK;
  }

  const seen = new Set<string>();
  const deduped: LocationOption[] = [];

  for (const loc of filtered) {
    const node = getRouteNodeFromName(loc.name);
    if (!node || seen.has(node)) {
      continue;
    }
    seen.add(node);
    deduped.push(loc);
  }

  // Ensure all fallback nodes are present (e.g. DAKAR may be missing from DB)
  for (const fallback of ROUTES_LOCATION_FALLBACK) {
    const node = getRouteNodeFromName(fallback.name);
    if (node && !seen.has(node)) {
      seen.add(node);
      deduped.push(fallback);
    }
  }

  return deduped;
};

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
interface ReservationFormProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

const STEP_LABELS = ['TRAJET', 'BESOINS', 'CONTACT'] as const;

export function ReservationForm({ onClose, isEmbedded = false }: ReservationFormProps = {}) {
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
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);

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
      }
    };
    fetchServices();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        if (data.success) {
          setLocations(toAllowedRouteLocations(data.data || []));
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des lieux:", error);
        setLocations(ROUTES_LOCATION_FALLBACK);
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
      if (pickupParam && getRouteNodeFromName(pickupParam)) newData.pickupAddress = pickupParam;
      if (destinationParam && getRouteNodeFromName(destinationParam)) newData.destinationAddress = destinationParam;
      if (datetimeParam) newData.datetime = datetimeParam;
      if (passengersParam) newData.passengers = parseInt(passengersParam, 10) || 1;

      if (newData.pickupAddress && newData.destinationAddress && !isRouteCombinationAllowed(newData.pickupAddress, newData.destinationAddress)) {
        newData.destinationAddress = "";
      }

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

  const handleLocationChange = (field: 'pickupAddress' | 'destinationAddress', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (next.pickupAddress && next.destinationAddress && !isRouteCombinationAllowed(next.pickupAddress, next.destinationAddress)) {
        if (field === 'pickupAddress') {
          next.destinationAddress = '';
        } else {
          next.pickupAddress = '';
        }
      }
      return next;
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

  const pickupOptions = locations.filter((loc) => {
    if (!formData.destinationAddress) {
      return true;
    }
    return isRouteCombinationAllowed(loc.name, formData.destinationAddress);
  });

  const destinationOptions = locations.filter((loc) => {
    if (!formData.pickupAddress) {
      return true;
    }
    return isRouteCombinationAllowed(formData.pickupAddress, loc.name);
  });

  const isInvalidCombination = Boolean(
    formData.pickupAddress && formData.destinationAddress && !isRouteCombinationAllowed(formData.pickupAddress, formData.destinationAddress)
  );

  const isStep1Complete = Boolean(
    formData.serviceType &&
    !(formData.serviceType === "autres" && !formData.customServiceType) &&
    formData.pickupAddress &&
    formData.destinationAddress &&
    !isInvalidCombination &&
    formData.datetime
  );

  const isStep3Complete = Boolean(
    formData.contactPhone && (isSignedIn || (formData.clientName && formData.clientEmail))
  );

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center text-foreground">Chargement...</div>
    </div>;
  }

  const selectedServiceName = formData.serviceType === "autres"
    ? formData.customServiceType
    : (dbServices.find(s => s.slug === formData.serviceType)?.name ||
      serviceTypes.find(s => s.id === formData.serviceType)?.name ||
      'Non défini');

  return (
    <div className={isEmbedded ? "relative overflow-x-hidden font-archivo" : "min-h-screen relative overflow-x-hidden bg-background font-archivo"}>
      {!isEmbedded && <Navigation variant="transparent" />}

      <div className={`${isEmbedded ? 'pt-8' : 'pt-32'} pb-16 px-4 sm:px-6`}>
        {/* Fil de progression — le corridor */}
        <div className="max-w-2xl mx-auto mb-12 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-[9px] left-0 right-0 h-[1.5px] bg-[#12100E] z-0" />
            {[1, 2, 3].map((step, i) => {
              const isActive = currentStep === step;
              const isPast = currentStep > step;
              return (
                <div key={step} className="flex flex-col items-center gap-2 relative z-10 bg-background px-2">
                  <button
                    type="button"
                    onClick={() => isPast && setCurrentStep(step)}
                    disabled={!isPast}
                    className={`w-[13px] h-[13px] rounded-full border-2 transition-colors ${isActive || isPast
                      ? (i === 2 ? 'bg-[#B4643A] border-[#B4643A]' : 'bg-accent border-accent')
                      : 'bg-background border-[#c9c3b8]'
                      }`}
                    aria-label={STEP_LABELS[i]}
                  />
                  <span className={`text-[11px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.12em] whitespace-nowrap ${isActive ? 'text-[#12100E] font-medium' : isPast ? 'text-[#12100E]' : 'text-[#a8a199]'
                    }`}>
                    {step} · {STEP_LABELS[i]}
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
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="relative z-10"
            >
              {/* Message pour les utilisateurs non connectés */}
              {!isSignedIn && currentStep === 1 && (
                <div className="mb-8 p-5 rounded border border-border bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-foreground font-semibold">Réservation express</h3>
                      <p className="text-[#3d3a35] text-sm">Connectez-vous pour pré-remplir vos informations et suivre vos trajets. Aucun compte requis pour réserver.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <Link href="/auth/signin" className="flex-1 md:flex-none px-5 py-2.5 rounded border border-[#12100E] text-[#12100E] text-sm font-medium hover:bg-[#12100E] hover:text-white transition-colors text-center">
                      Connexion
                    </Link>
                    <Link href="/auth/signup" className="flex-1 md:flex-none px-5 py-2.5 rounded bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors text-center">
                      Créer un compte
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-border p-6 sm:p-10">

                {/* Étape 1: Trajet */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
                    <div className="space-y-7">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Où sur le corridor ?</h1>
                        <p className="text-[#3d3a35]">Décrivez votre trajet. Le véhicule est attribué par nos soins à l'étape suivante.</p>
                      </div>

                      {/* Type de service */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">Type de service</span>
                        <div className="flex flex-wrap gap-2">
                          {(dbServices.length > 0 ? dbServices : serviceTypes).map((service) => {
                            const id = service.slug || service.id;
                            const selected = formData.serviceType === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => handleInputChange('serviceType', id)}
                                className={`px-4 py-2.5 rounded text-sm font-medium font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${selected
                                  ? 'bg-[#12100E] text-white'
                                  : 'border border-[#c9c3b8] text-[#3d3a35] hover:border-[#12100E]'
                                  }`}
                              >
                                {service.name}
                              </button>
                            );
                          })}
                        </div>
                        {formData.serviceType === "autres" && (
                          <input
                            type="text"
                            value={formData.customServiceType}
                            onChange={(e) => handleInputChange('customServiceType', e.target.value)}
                            placeholder="Précisez votre besoin (transport événementiel, tournage...)"
                            className="mt-2 w-full bg-white border border-border rounded p-3 text-foreground placeholder:text-[#a8a199] focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                          />
                        )}
                      </div>

                      {/* Départ / Arrivée — jalons corridor */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-[13px] h-[13px] rounded-full bg-accent shrink-0" />
                          <div className="flex-1 relative">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">Départ</span>
                            {locations.length > 0 ? (
                              <select
                                value={formData.pickupAddress}
                                onChange={(e) => handleLocationChange('pickupAddress', e.target.value)}
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                              >
                                <option value="" disabled>Sélectionnez un lieu...</option>
                                {pickupOptions.map(loc => (
                                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.pickupAddress}
                                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                                placeholder="Aéroport AIBD, Dakar..."
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pl-[3px]">
                          <div className="w-[7px] h-6 border-l-2 border-[#12100E] ml-[0px]" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-[13px] h-[13px] rounded-full bg-[#B4643A] shrink-0" />
                          <div className="flex-1">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">Arrivée</span>
                            {locations.length > 0 ? (
                              <select
                                value={formData.destinationAddress}
                                onChange={(e) => handleLocationChange('destinationAddress', e.target.value)}
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                              >
                                <option value="" disabled>Sélectionnez une destination...</option>
                                {destinationOptions.map(loc => (
                                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.destinationAddress}
                                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                                placeholder="Almadies, Hôtel Terrou-Bi..."
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            )}
                          </div>
                        </div>
                        {isInvalidCombination && (
                          <p className="text-xs text-[#B8493C] pl-[29px]">
                            Combinaison non autorisée. Choisissez uniquement DAKAR vers AIBD, MBOUR, SALY, NGAPAROU, THIES, NIANING, POINTE SARRENE, SOMONE (et inverse).
                          </p>
                        )}
                      </div>

                      {/* Date, heure, passagers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white border border-border rounded p-3">
                          <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">Date &amp; heure</span>
                          <input
                            type="datetime-local"
                            value={formData.datetime}
                            onChange={(e) => handleInputChange('datetime', e.target.value)}
                            className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        <div className="bg-white border border-border rounded p-3 flex items-center gap-2">
                          <Users size={16} weight="light" className="text-[#6E6A63]" />
                          <div className="flex-1">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">Passagers</span>
                            <select
                              value={formData.passengers}
                              onChange={(e) => handleInputChange('passengers', Number(e.target.value))}
                              className="bg-transparent text-foreground font-medium focus:outline-none w-full cursor-pointer"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                                <option key={n} value={n}>{n === 11 ? '10+' : n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estimation */}
                    <div className="space-y-4">
                      <div className="h-40 rounded bg-[#E8DCC8] flex items-end p-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.1em] uppercase text-[#6b6154] bg-[#F7F3EC] px-2 py-1.5 rounded">Carte du trajet</span>
                      </div>
                      <div className="bg-[#12100E] rounded p-6 space-y-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#9a938a] uppercase block">Votre demande</span>
                        <p className="text-white font-medium">{selectedServiceName}</p>
                        <div className="h-px bg-[#2e2b27]" />
                        <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
                          <div className="flex justify-between"><span>PÉAGE &amp; CARBURANT</span><span>INCLUS</span></div>
                          <div className="flex justify-between"><span>ATTENTE 60 MIN</span><span>INCLUS</span></div>
                          <div className="flex justify-between"><span>TARIF</span><span>SUR DEVIS</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 2: Besoins */}
                {currentStep === 2 && (
                  <div className="space-y-8 max-w-2xl">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Que faut-il prévoir ?</h1>
                      <p className="text-[#3d3a35]">Le véhicule est attribué par nos soins selon les passagers et les bagages. Dites-nous seulement ce dont vous avez besoin à bord.</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">Bagages</span>
                      <div className="flex items-center gap-2 bg-white border border-border rounded p-2 w-fit">
                        <Bag size={16} weight="light" className="text-[#6E6A63]" />
                        <select
                          value={formData.luggage}
                          onChange={(e) => handleInputChange('luggage', Number(e.target.value))}
                          className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer pr-2"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                            <option key={n} value={n}>{n === 11 ? '10+' : n} valise{n > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">Options sans supplément</span>
                      <div className="flex flex-wrap gap-2">
                        {additionalServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleAdditionalServiceToggle(service.id)}
                            className={`px-4 py-2.5 rounded text-sm font-medium transition-colors ${formData.additionalServices.includes(service.id)
                              ? 'bg-[#12100E] text-white'
                              : 'border border-[#c9c3b8] text-[#3d3a35] hover:border-[#12100E]'
                              }`}
                          >
                            {service.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">Précisions pour le chauffeur — facultatif</span>
                      <textarea
                        value={formData.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                        placeholder="Point de rendez-vous exact, code portail, nom de l'hôtel, arrêt en route..."
                        rows={3}
                        className="w-full bg-white border border-border rounded p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 3: Contact */}
                {currentStep === 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
                    <div className="space-y-7">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Comment vous joindre ?</h1>
                        <p className="text-[#3d3a35]">Nous confirmons par téléphone dans les trente minutes.</p>
                      </div>

                      {!isSignedIn && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">Nom et prénom</span>
                            <div className="flex items-center gap-2">
                              <User size={16} weight="light" className="text-[#6E6A63] shrink-0" />
                              <input
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => handleInputChange('clientName', e.target.value)}
                                placeholder="Alpha Oumar Sow"
                                className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">E-mail</span>
                            <div className="flex items-center gap-2">
                              <EnvelopeSimple size={16} weight="light" className="text-[#6E6A63] shrink-0" />
                              <input
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                placeholder="votre@email.com"
                                className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white border-[1.5px] border-accent rounded p-3 max-w-sm">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-accent uppercase block mb-1">Téléphone / WhatsApp</span>
                        <div className="flex items-center gap-2">
                          <Phone size={16} weight="light" className="text-accent shrink-0" />
                          <input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            placeholder="+221 77 XXX XX XX"
                            className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Récapitulatif */}
                    <div className="bg-white border border-border rounded p-6 space-y-4 h-fit">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#6E6A63] uppercase block">Votre course</span>
                      <div className="flex flex-col gap-0">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center w-[11px]">
                            <div className="w-[11px] h-[11px] rounded-full bg-accent" />
                            <div className="w-px flex-1 bg-[#12100E]" />
                          </div>
                          <div className="pb-4">
                            <p className="font-medium text-foreground">{formData.pickupAddress || 'Non défini'}</p>
                            <p className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                              {formData.datetime ? new Date(formData.datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '--'} · {formData.datetime ? new Date(formData.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-[11px] flex justify-center">
                            <div className="w-[11px] h-[11px] rounded-full bg-[#B4643A]" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{formData.destinationAddress || 'Non défini'}</p>
                            <p className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">{formData.passengers === 11 ? '10+' : formData.passengers} passager{formData.passengers > 1 ? 's' : ''} · {formData.luggage === 11 ? '10+' : formData.luggage} bagage{formData.luggage > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                        <div className="flex justify-between"><span>SERVICE</span><span className="text-foreground">{selectedServiceName}</span></div>
                        <div className="flex justify-between"><span>VÉHICULE</span><span className="text-foreground">ATTRIBUÉ</span></div>
                        <div className="flex justify-between"><span>TARIF</span><span className="text-foreground">SUR DEVIS</span></div>
                      </div>
                      {formData.specialRequests && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="flex items-start gap-2">
                            <ChatCircle size={14} weight="regular" className="text-[#6E6A63] mt-0.5 shrink-0" />
                            <p className="text-xs text-[#3d3a35] italic">"{formData.specialRequests}"</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="mt-10 flex items-center justify-between gap-6">
                <div>
                  {currentStep > 1 ? (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-2 text-[#12100E] font-semibold text-sm hover:opacity-70 transition-opacity"
                    >
                      <ArrowLeft size={16} weight="regular" /> Retour
                    </button>
                  ) : (
                    <button
                      onClick={() => isEmbedded && onClose ? onClose() : router.push('/')}
                      className="text-[#6E6A63] hover:text-[#12100E] transition-colors text-sm font-medium"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {currentStep < 3 ? (
                    <>
                      {currentStep === 1 && <span className="hidden sm:inline text-xs font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">AUCUN COMPTE REQUIS</span>}
                      <Button
                        variant="primary"
                        onClick={nextStep}
                        disabled={currentStep === 1 && !isStep1Complete}
                        icon={<ArrowRight size={18} weight="regular" />}
                        iconPosition="right"
                      >
                        Continuer
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isInvalidCombination || !isStep3Complete}
                      loading={isSubmitting}
                      icon={<BookNowIcon size={18} color="white" />}
                    >
                      Confirmer la réservation
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Modal de confirmation de succès */}
          <ConfirmationModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="Réservation enregistrée !"
            message="C'est noté. Nous vous confirmons sous 30 minutes par téléphone. Notre équipe vous contactera pour valider les détails et le tarif."
            type="success"
            confirmText="Parfait !"
            onConfirm={() => {
              setShowSuccessModal(false);

              if (isEmbedded && onClose) {
                onClose();
              } else if (isSignedIn && user?.role === 'customer') {
                router.push('/client/dashboard?tab=bookings');
              } else {
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
                router.push('/');
              }
            }}
          />

          {/* Modal d'erreur */}
          <ConfirmationModal
            isOpen={errorModal.open}
            onClose={() => setErrorModal({ ...errorModal, open: false })}
            title={errorModal.title}
            message={errorModal.message}
            type="error"
            confirmText="Réessayer"
            onConfirm={() => setErrorModal({ ...errorModal, open: false })}
          />
        </div>
      </div>
      {!isEmbedded && <Footer />}
    </div>
  );
}

export default function ReservationClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-foreground animate-pulse">Chargement de votre expérience...</div>
      </div>
    }>
      <ReservationForm />
    </Suspense>
  );
}
