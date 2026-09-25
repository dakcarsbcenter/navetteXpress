"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Button } from "@/components/ui/Button";
import { BookNowIcon } from "@/components/icons/custom-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Bag, Phone, EnvelopeSimple, ArrowRight, ArrowLeft, ChatCircle, User, Airplane } from "@phosphor-icons/react";
import { serviceTypes, additionalServices, getServiceById } from "@/lib/services";
import { useRouter } from "@/i18n/navigation";
import NextLink from "next/link";
import { type RouteNodeKey, getRouteNodeFromName } from "@/lib/route-nodes";
import {
  OTHER_LOCATION_VALUE,
  isRouteCombinationAllowed,
  matchPricingSegments,
  segmentPrice,
} from "@/lib/pricing";
import { fetchPublicApi } from "@/lib/apiClient";
import { trackBookingSubmitted } from "@/lib/analytics";
import { Combobox } from "@/components/ui/Combobox";
import { AIRLINES, FLIGHTS, airlineFromFlightNumber } from "@/lib/flights";

type LocationOption = { id: string; name: string };

// Service tel que renvoyé par /api/services (nom en une seule langue, contrairement
// aux ServiceType statiques de @/lib/services qui portent des traductions par locale).
interface DbServiceOption {
  id: number;
  slug: string;
  name: string;
}

interface PricingSegment {
  id: number;
  route: string;
  berline: number;
  suv: number;
  departNode: RouteNodeKey | null;
  arriveeNode: RouteNodeKey | null;
  isActive: boolean;
}

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

// Le transfert aéroport représente l'essentiel des demandes : on le pré-sélectionne
// pour que le visiteur n'ait qu'à renseigner son trajet.
const DEFAULT_SERVICE_TYPE = "transfert-aibd-dakar";

interface FormData {
  serviceType: string;
  customServiceType: string;
  datetime: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupCustomLocation: string;
  destinationCustomLocation: string;
  passengers: number;
  luggage: number;
  duration: number;
  vehicleType: "berline" | "suv";
  additionalServices: string[];
  specialRequests: string;
  contactPhone: string;
  // Champs pour les utilisateurs non connectés
  clientName: string;
  clientEmail: string;
  // Réservation pour un tiers (cas fréquent : un proche réserve pour quelqu'un
  // qui ne lit pas ou n'a pas d'accès numérique). 'self' n'envoie aucun passager.
  bookingFor: 'self' | 'other';
  passengerName: string;
  passengerPhone: string;
  // Vol (transferts aéroport uniquement)
  flightNumber: string;
  airline: string;
}

// Composant interne qui utilise useSearchParams
interface ReservationFormProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export function ReservationForm({ onClose, isEmbedded = false }: ReservationFormProps = {}) {
  const t = useTranslations("reservation");
  const locale = useLocale() as "fr" | "en" | "es";
  const STEP_LABELS = [t('steps.trip'), t('steps.needs'), t('steps.contact')] as const;
  const { data: session, status } = useSession();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const isSignedIn = !!session;
  const isLoaded = status !== "loading";
  const user = session?.user as unknown as { id?: string; name?: string; email?: string; role?: string } | undefined;

  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    serviceType: DEFAULT_SERVICE_TYPE,
    customServiceType: "",
    datetime: "",
    pickupAddress: "",
    destinationAddress: "",
    pickupCustomLocation: "",
    destinationCustomLocation: "",
    passengers: 1,
    luggage: 1,
    duration: 2,
    vehicleType: "berline",
    additionalServices: [],
    specialRequests: "",
    contactPhone: "",
    clientName: "",
    clientEmail: "",
    bookingFor: "self",
    passengerName: "",
    passengerPhone: "",
    flightNumber: "",
    airline: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [dbServices, setDbServices] = useState<DbServiceOption[]>([]);
  const [pricingSegments, setPricingSegments] = useState<PricingSegment[]>([]);

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

  // Fetch pricing segments (pour l'auto-affichage du prix une fois départ/arrivée choisis)
  useEffect(() => {
    const fetchPricingSegments = async () => {
      try {
        const response = await fetchPublicApi('/api/pricing-segments');
        const data = await response.json();
        if (data.success) {
          setPricingSegments(data.data || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tarifs:", error);
      }
    };
    fetchPricingSegments();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetchPublicApi('/api/locations');
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
      // Revenir à "je réserve pour moi" ne doit laisser aucun résidu de passager
      // dans le payload envoyé à l'API.
      if (field === 'bookingFor' && value === 'self') {
        return { ...prev, bookingFor: 'self', passengerName: '', passengerPhone: '' };
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

  // Suggestions de vol : le code IATA de la compagnie sert aussi de filtre, pour que
  // taper "air france" propose AF718 autant que "AF7".
  const flightOptions = FLIGHTS.map((flight) => ({
    value: flight.number,
    label: flight.number,
    hint: flight.route,
    keywords: `${flight.airlineIata} ${AIRLINES.find((a) => a.iata === flight.airlineIata)?.name ?? ''}`,
  }));

  // On stocke le nom de la compagnie (et non son code) : c'est ce qu'affichent l'admin,
  // les e-mails et les messages WhatsApp.
  const airlineOptions = AIRLINES.map((airline) => ({
    value: airline.name,
    label: airline.name,
    hint: airline.iata,
    keywords: airline.iata,
  }));

  // Le préfixe du numéro de vol désigne la compagnie : on la pré-remplit tant que le
  // client n'a pas saisi autre chose de son côté.
  const handleFlightNumberChange = (value: string) => {
    setFormData(prev => {
      const next = { ...prev, flightNumber: value };
      const deduced = airlineFromFlightNumber(value)?.name;
      const previouslyDeduced = airlineFromFlightNumber(prev.flightNumber)?.name;
      const airlineIsOurs = !prev.airline.trim() || prev.airline === previouslyDeduced;
      // Une compagnie déduite ne doit pas survivre à un changement de vol : sinon
      // "AF719 / Air France" corrigé en "XX999" partirait avec la mauvaise compagnie.
      if (airlineIsOurs) {
        next.airline = deduced ?? '';
      }
      return next;
    });
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
          pickupAddress: formData.pickupAddress === OTHER_LOCATION_VALUE ? formData.pickupCustomLocation.trim() : formData.pickupAddress,
          destinationAddress: formData.destinationAddress === OTHER_LOCATION_VALUE ? formData.destinationCustomLocation.trim() : formData.destinationAddress,
          passengers: formData.passengers,
          luggage: formData.luggage,
          duration: formData.duration,
          vehicleType: formData.vehicleType,
          estimatedPrice: selectedPrice,
          additionalServices: formData.additionalServices,
          // Quand le trajet couvre plusieurs secteurs tarifaires, aucun prix ferme n'est
          // envoyé : on transmet la fourchette à l'admin pour qu'il propose le tarif exact.
          specialRequests: selectedPrice === null && priceLabel
            ? [formData.specialRequests, `Tarif indicatif: ${priceLabel}`].filter(Boolean).join('\n')
            : formData.specialRequests,
          contactPhone: formData.contactPhone,
          contactEmail: formData.clientEmail || user?.email || "",
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          passengerName: formData.bookingFor === 'other' ? formData.passengerName.trim() : null,
          passengerPhone: formData.bookingFor === 'other' ? formData.passengerPhone.trim() || null : null,
          userId: user?.id,
          flightNumber: isAirportTrip ? formData.flightNumber.trim() || undefined : undefined,
          airline: isAirportTrip ? formData.airline.trim() || undefined : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Conversion : reservation reellement enregistree cote API.
        trackBookingSubmitted({
          serviceType: formData.serviceType,
          vehicleType: formData.vehicleType,
          price: selectedPrice ?? undefined,
        });
        setIsSubmitting(false);
        setShowSuccessModal(true);
      } else {
        // Ouvre une jolie modale d'erreur au lieu d'un alert natif
        const msg = result.error || t('errors.defaultMessage');
        const isForbidden = response.status === 403 || /permission/i.test(msg);
        setErrorModal({
          open: true,
          title: isForbidden ? t('errors.forbiddenTitle') : t('errors.genericTitle'),
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
        title: t('errors.genericTitle'),
        message: t('errors.networkMessage')
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

  // Tarif indicatif : les segments de tarifs (paramétrés en admin) correspondant au couple
  // départ/arrivée choisi, dans un sens ou l'autre. La logique de matching est partagée avec
  // le back-office (src/lib/pricing.ts) pour que l'admin repropose exactement le même tarif
  // quand il corrige le trajet d'une réservation. "Autre" (adresse libre) ou une combinaison
  // sans tarif paramétré ne matche rien — l'admin renseignera le prix manuellement.
  const matchedPricingSegments = matchPricingSegments(
    pricingSegments,
    formData.pickupAddress,
    formData.destinationAddress,
  );

  // Certains couples départ/arrivée (ex: DAKAR<->AIBD) ont plusieurs tarifs actifs paramétrés
  // en admin (un par secteur : "Dakar Plateau", "Almadies / Ngor"...). Plutôt que de demander
  // au client d'arbitrer un découpage interne qu'il ne connaît pas, on affiche une fourchette
  // et l'équipe confirme le tarif exact avant la course.
  const matchedPrices = matchedPricingSegments.map((segment) =>
    segmentPrice(segment, formData.vehicleType === 'suv' ? 'suv' : 'berline'),
  );
  const minPrice = matchedPrices.length > 0 ? Math.min(...matchedPrices) : null;
  const maxPrice = matchedPrices.length > 0 ? Math.max(...matchedPrices) : null;
  // Prix ferme seulement quand tous les segments s'accordent ; sinon l'admin tranchera.
  const selectedPrice = minPrice !== null && minPrice === maxPrice ? minPrice : null;

  const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;
  // Libellé de tarif partagé par les récapitulatifs des étapes 1 et 3.
  const priceLabel =
    minPrice === null || maxPrice === null
      ? null
      : minPrice === maxPrice
        ? formatPrice(minPrice)
        : `${minPrice.toLocaleString('fr-FR')} – ${formatPrice(maxPrice)}`;

  // Transfert impliquant l'aéroport AIBD : on propose la saisie du numéro de
  // vol pour permettre le suivi en direct côté client une fois la demande créée.
  const isAirportTrip = Boolean(
    formData.serviceType === DEFAULT_SERVICE_TYPE ||
    getRouteNodeFromName(formData.pickupAddress) === 'AIBD' ||
    getRouteNodeFromName(formData.destinationAddress) === 'AIBD'
  );

  const isStep1Complete = Boolean(
    formData.serviceType &&
    !(formData.serviceType === "autres" && !formData.customServiceType) &&
    formData.pickupAddress &&
    !(formData.pickupAddress === OTHER_LOCATION_VALUE && !formData.pickupCustomLocation.trim()) &&
    formData.destinationAddress &&
    !(formData.destinationAddress === OTHER_LOCATION_VALUE && !formData.destinationCustomLocation.trim()) &&
    !isInvalidCombination &&
    formData.datetime
  );

  const displayPickupAddress = formData.pickupAddress === OTHER_LOCATION_VALUE
    ? formData.pickupCustomLocation
    : formData.pickupAddress;
  const displayDestinationAddress = formData.destinationAddress === OTHER_LOCATION_VALUE
    ? formData.destinationCustomLocation
    : formData.destinationAddress;

  const isStep3Complete = Boolean(
    formData.contactPhone &&
    (isSignedIn || (formData.clientName && formData.clientEmail)) &&
    (formData.bookingFor === 'self' || formData.passengerName.trim().length >= 2)
  );

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center text-foreground">{t('loading.auth')}</div>
    </div>;
  }

  const selectedServiceName = formData.serviceType === "autres"
    ? formData.customServiceType
    : (dbServices.find(s => s.slug === formData.serviceType)?.name ||
      (serviceTypes.find(s => s.id === formData.serviceType)?.translations[locale]?.name ??
        serviceTypes.find(s => s.id === formData.serviceType)?.translations.fr.name) ||
      t('step1.notDefined'));

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
                      <h3 className="text-foreground font-semibold">{t('expressBanner.title')}</h3>
                      <p className="text-[#3d3a35] text-sm">{t('expressBanner.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <NextLink href="/auth/signin" className="flex-1 md:flex-none px-5 py-2.5 rounded border border-[#12100E] text-[#12100E] text-sm font-medium hover:bg-[#12100E] hover:text-white transition-colors text-center">
                      {t('expressBanner.signIn')}
                    </NextLink>
                    <NextLink href="/auth/signup" className="flex-1 md:flex-none px-5 py-2.5 rounded bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors text-center">
                      {t('expressBanner.signUp')}
                    </NextLink>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-border p-6 sm:p-10">

                {/* Étape 1: Trajet */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
                    <div className="space-y-7">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">{t('step1.title')}</h1>
                        <p className="text-[#3d3a35]">{t('step1.subtitle')}</p>
                      </div>

                      {/* Type de service */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step1.serviceTypeLabel')}</span>
                        <select
                          value={formData.serviceType}
                          onChange={(e) => handleInputChange('serviceType', e.target.value)}
                          className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                        >
                          <option value="" disabled>{t('step1.serviceTypeSelectPlaceholder')}</option>
                          {(dbServices.length > 0 ? dbServices : serviceTypes).map((service) => {
                            const id = 'slug' in service ? service.slug : service.id;
                            const name = 'name' in service ? service.name : (service.translations[locale]?.name ?? service.translations.fr.name);
                            return <option key={id} value={id}>{name}</option>;
                          })}
                        </select>
                        {formData.serviceType === "autres" && (
                          <input
                            type="text"
                            value={formData.customServiceType}
                            onChange={(e) => handleInputChange('customServiceType', e.target.value)}
                            placeholder={t('step1.customServicePlaceholder')}
                            className="mt-2 w-full bg-white border border-border rounded p-3 text-foreground placeholder:text-[#a8a199] focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                          />
                        )}
                      </div>

                      {/* Départ / Arrivée — jalons corridor */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-[13px] h-[13px] rounded-full bg-accent shrink-0" />
                          <div className="flex-1 relative">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.departureLabel')}</span>
                            {locations.length > 0 ? (
                              <select
                                value={formData.pickupAddress}
                                onChange={(e) => handleLocationChange('pickupAddress', e.target.value)}
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                              >
                                <option value="" disabled>{t('step1.pickupSelectPlaceholder')}</option>
                                {pickupOptions.map(loc => (
                                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                                ))}
                                <option value={OTHER_LOCATION_VALUE}>{t('step1.otherLocationOption')}</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.pickupAddress}
                                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                                placeholder={t('step1.pickupInputPlaceholder')}
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            )}
                            {formData.pickupAddress === OTHER_LOCATION_VALUE && (
                              <input
                                type="text"
                                value={formData.pickupCustomLocation}
                                onChange={(e) => handleInputChange('pickupCustomLocation', e.target.value)}
                                placeholder={t('step1.pickupCustomPlaceholder')}
                                className="mt-2 w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium placeholder:text-[#a8a199] focus:outline-none focus:ring-1 focus:ring-accent"
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
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.arrivalLabel')}</span>
                            {locations.length > 0 ? (
                              <select
                                value={formData.destinationAddress}
                                onChange={(e) => handleLocationChange('destinationAddress', e.target.value)}
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                              >
                                <option value="" disabled>{t('step1.destinationSelectPlaceholder')}</option>
                                {destinationOptions.map(loc => (
                                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                                ))}
                                <option value={OTHER_LOCATION_VALUE}>{t('step1.otherLocationOption')}</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.destinationAddress}
                                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                                placeholder={t('step1.destinationInputPlaceholder')}
                                className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            )}
                            {formData.destinationAddress === OTHER_LOCATION_VALUE && (
                              <input
                                type="text"
                                value={formData.destinationCustomLocation}
                                onChange={(e) => handleInputChange('destinationCustomLocation', e.target.value)}
                                placeholder={t('step1.destinationCustomPlaceholder')}
                                className="mt-2 w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium placeholder:text-[#a8a199] focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            )}
                          </div>
                        </div>
                        {isInvalidCombination && (
                          <p className="text-xs text-[#B8493C] pl-[29px]">
                            {t('step1.invalidCombination')}
                          </p>
                        )}
                      </div>

                      {/* Date, heure, passagers, bagages */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white border border-border rounded p-3 sm:col-span-2">
                          <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.datetimeLabel')}</span>
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
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.passengersLabel')}</span>
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
                        <div className="bg-white border border-border rounded p-3 flex items-center gap-2">
                          <Bag size={16} weight="light" className="text-[#6E6A63]" />
                          <div className="flex-1">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.luggageLabel')}</span>
                            <select
                              value={formData.luggage}
                              onChange={(e) => handleInputChange('luggage', Number(e.target.value))}
                              className="bg-transparent text-foreground font-medium focus:outline-none w-full cursor-pointer"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                                <option key={n} value={n}>{n === 11 ? '10+' : n} {t('step1.luggageUnit', { count: n })}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Type de véhicule */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step1.vehicleTypeLabel')}</span>
                        <div className="flex flex-wrap gap-2">
                          {(['berline', 'suv'] as const).map((type) => {
                            const selected = formData.vehicleType === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleInputChange('vehicleType', type)}
                                className={`px-4 py-2.5 rounded text-sm font-medium font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${selected
                                  ? 'bg-[#12100E] text-white'
                                  : 'border border-[#c9c3b8] text-[#3d3a35] hover:border-[#12100E]'
                                  }`}
                              >
                                {type === 'berline' ? t('step1.vehicleTypeBerline') : t('step1.vehicleTypeSuv')}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Estimation */}
                    <div className="space-y-4">
                      <div className="h-40 rounded bg-[#E8DCC8] flex items-end p-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.1em] uppercase text-[#6b6154] bg-[#F7F3EC] px-2 py-1.5 rounded">{t('step1.mapPlaceholder')}</span>
                      </div>
                      <div className="bg-[#12100E] rounded p-6 space-y-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#9a938a] uppercase block">{t('step1.requestSummary.label')}</span>
                        <p className="text-white font-medium">{selectedServiceName}</p>
                        <div className="h-px bg-[#2e2b27]" />
                        <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
                          <div className="flex justify-between"><span>{t('step1.requestSummary.toll')}</span><span>{t('step1.requestSummary.included')}</span></div>
                          <div className="flex justify-between"><span>{t('step1.requestSummary.wait')}</span><span>{t('step1.requestSummary.included')}</span></div>
                          <div className="flex justify-between">
                            <span>{t('step1.requestSummary.rate')}</span>
                            <span className={priceLabel !== null ? "text-white" : undefined}>
                              {priceLabel ?? t('step1.requestSummary.onQuote')}
                            </span>
                          </div>
                        </div>
                        {priceLabel !== null && (
                          <p className="text-[10px] text-[#6E6A63] leading-relaxed">
                            {t('step1.requestSummary.estimateNote', { vehicle: formData.vehicleType === 'suv' ? t('step1.vehicleTypeSuv') : t('step1.vehicleTypeBerline') })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 2: Besoins */}
                {currentStep === 2 && (
                  <div className="space-y-8 max-w-2xl">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">{t('step2.title')}</h1>
                      <p className="text-[#3d3a35]">{t('step2.subtitle')}</p>
                    </div>

                    {isAirportTrip && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step2.flightSectionLabel')}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step2.flightNumberLabel')}</span>
                            <Combobox
                              value={formData.flightNumber}
                              onValueChange={handleFlightNumberChange}
                              options={flightOptions}
                              transform={(raw) => raw.toUpperCase()}
                              allowFreeText
                              placeholder={t('step2.flightNumberPlaceholder')}
                              noResultsLabel={t('step2.flightNoResults')}
                              leading={<Airplane size={16} weight="light" className="text-[#6E6A63] shrink-0" />}
                              inputClassName="w-full bg-transparent text-foreground font-medium focus:outline-none"
                            />
                          </div>
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step2.airlineLabel')}</span>
                            <Combobox
                              value={formData.airline}
                              onValueChange={(value) => handleInputChange('airline', value)}
                              options={airlineOptions}
                              allowFreeText
                              placeholder={t('step2.airlinePlaceholder')}
                              noResultsLabel={t('step2.airlineNoResults')}
                              inputClassName="w-full bg-transparent text-foreground font-medium focus:outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6E6A63]">{t('step2.flightSectionHint')}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step2.optionsLabel')}</span>
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
                            {service.translations[locale]?.name ?? service.translations.fr.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step2.notesLabel')}</span>
                      <textarea
                        value={formData.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                        placeholder={t('step2.notesPlaceholder')}
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
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">{t('step3.title')}</h1>
                        <p className="text-[#3d3a35]">{t('step3.subtitle')}</p>
                      </div>

                      {/* Réservation pour soi-même ou pour un tiers : permet à un proche de
                          commander la course pour quelqu'un qui ne peut pas le faire lui-même. */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step3.bookingForLabel')}</span>
                        <div className="flex flex-wrap gap-2">
                          {(['self', 'other'] as const).map((choice) => {
                            const selected = formData.bookingFor === choice;
                            return (
                              <button
                                key={choice}
                                type="button"
                                onClick={() => handleInputChange('bookingFor', choice)}
                                aria-pressed={selected}
                                className={`px-4 py-2.5 rounded text-sm font-medium font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${selected
                                  ? 'bg-[#12100E] text-white'
                                  : 'border border-[#c9c3b8] text-[#3d3a35] hover:border-[#12100E]'
                                  }`}
                              >
                                {choice === 'self' ? t('step3.bookingForSelf') : t('step3.bookingForOther')}
                              </button>
                            );
                          })}
                        </div>

                        {formData.bookingFor === 'other' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white border border-border rounded p-3">
                              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step3.passengerNameLabel')}</span>
                              <div className="flex items-center gap-2">
                                <User size={16} weight="light" className="text-[#6E6A63] shrink-0" />
                                <input
                                  type="text"
                                  value={formData.passengerName}
                                  onChange={(e) => handleInputChange('passengerName', e.target.value)}
                                  placeholder={t('step3.passengerNamePlaceholder')}
                                  className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="bg-white border border-border rounded p-3">
                              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">
                                {t('step3.passengerPhoneLabel')} <span className="text-[#a8a199] normal-case tracking-normal">· {t('step3.passengerOptional')}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <Phone size={16} weight="light" className="text-[#6E6A63] shrink-0" />
                                <input
                                  type="tel"
                                  value={formData.passengerPhone}
                                  onChange={(e) => handleInputChange('passengerPhone', e.target.value)}
                                  placeholder={t('step3.passengerPhonePlaceholder')}
                                  className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isSignedIn && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step3.nameLabel')}</span>
                            <div className="flex items-center gap-2">
                              <User size={16} weight="light" className="text-[#6E6A63] shrink-0" />
                              <input
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => handleInputChange('clientName', e.target.value)}
                                placeholder={t('step3.namePlaceholder')}
                                className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step3.emailLabel')}</span>
                            <div className="flex items-center gap-2">
                              <EnvelopeSimple size={16} weight="light" className="text-[#6E6A63] shrink-0" />
                              <input
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                placeholder={t('step3.emailPlaceholder')}
                                className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white border-[1.5px] border-accent rounded p-3 max-w-sm">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-accent uppercase block mb-1">{t('step3.phoneLabel')}</span>
                        <div className="flex items-center gap-2">
                          <Phone size={16} weight="light" className="text-accent shrink-0" />
                          <input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            placeholder={t('step3.phonePlaceholder')}
                            className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Récapitulatif */}
                    <div className="bg-white border border-border rounded p-6 space-y-4 h-fit">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#6E6A63] uppercase block">{t('step3.summary.label')}</span>
                      <div className="flex flex-col gap-0">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center w-[11px]">
                            <div className="w-[11px] h-[11px] rounded-full bg-accent" />
                            <div className="w-px flex-1 bg-[#12100E]" />
                          </div>
                          <div className="pb-4">
                            <p className="font-medium text-foreground">{displayPickupAddress || t('step3.summary.notDefined')}</p>
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
                            <p className="font-medium text-foreground">{displayDestinationAddress || t('step3.summary.notDefined')}</p>
                            <p className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">{formData.passengers === 11 ? '10+' : formData.passengers} {t('step3.summary.passengersUnit', { count: formData.passengers })} · {formData.luggage === 11 ? '10+' : formData.luggage} {t('step3.summary.luggageUnit', { count: formData.luggage })}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                        {formData.bookingFor === 'other' && formData.passengerName.trim() && (
                          <div className="flex justify-between gap-3"><span>{t('step3.summary.passenger')}</span><span className="text-foreground text-right">{formData.passengerName.trim()}</span></div>
                        )}
                        <div className="flex justify-between"><span>{t('step3.summary.service')}</span><span className="text-foreground">{selectedServiceName}</span></div>
                        <div className="flex justify-between"><span>{t('step3.summary.vehicle')}</span><span className="text-foreground">{formData.vehicleType === 'suv' ? t('step1.vehicleTypeSuv') : t('step1.vehicleTypeBerline')}</span></div>
                        <div className="flex justify-between">
                          <span>{t('step3.summary.rate')}</span>
                          <span className="text-foreground">
                            {priceLabel ?? t('step3.summary.rateValue')}
                          </span>
                        </div>
                      </div>
                      {formData.specialRequests && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="flex items-start gap-2">
                            <ChatCircle size={14} weight="regular" className="text-[#6E6A63] mt-0.5 shrink-0" />
                            <p className="text-xs text-[#3d3a35] italic">&ldquo;{formData.specialRequests}&rdquo;</p>
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
                      <ArrowLeft size={16} weight="regular" /> {t('nav.back')}
                    </button>
                  ) : (
                    <button
                      onClick={() => isEmbedded && onClose ? onClose() : router.push('/')}
                      className="text-[#6E6A63] hover:text-[#12100E] transition-colors text-sm font-medium"
                    >
                      {t('nav.cancel')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {currentStep < 3 ? (
                    <>
                      {currentStep === 1 && <span className="hidden sm:inline text-xs font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">{t('nav.noAccountRequired')}</span>}
                      <Button
                        variant="primary"
                        onClick={nextStep}
                        disabled={currentStep === 1 && !isStep1Complete}
                        icon={<ArrowRight size={18} weight="regular" />}
                        iconPosition="right"
                      >
                        {t('nav.continue')}
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
                      {t('nav.confirm')}
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
            title={t('success.title')}
            message={t('success.message')}
            type="success"
            confirmText={t('success.confirm')}
            onConfirm={() => {
              setShowSuccessModal(false);

              if (isEmbedded && onClose) {
                onClose();
              } else if (isSignedIn && user?.role === 'customer') {
                nextRouter.push('/client/dashboard?tab=bookings');
              } else {
                setCurrentStep(1);
                setFormData({
                  serviceType: DEFAULT_SERVICE_TYPE,
                  customServiceType: "",
                  datetime: "",
                  pickupAddress: "",
                  destinationAddress: "",
                  pickupCustomLocation: "",
                  destinationCustomLocation: "",
                  passengers: 1,
                  luggage: 1,
                  duration: 2,
                  vehicleType: "berline",
                  additionalServices: [],
                  specialRequests: "",
                  contactPhone: "",
                  clientName: "",
                  clientEmail: "",
                  bookingFor: "self",
                  passengerName: "",
                  passengerPhone: "",
                  flightNumber: "",
                  airline: ""
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
            confirmText={t('errors.retry')}
            onConfirm={() => setErrorModal({ ...errorModal, open: false })}
          />
        </div>
      </div>
      {!isEmbedded && <Footer />}
    </div>
  );
}

export default function ReservationClient() {
  const t = useTranslations("reservation");
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-foreground animate-pulse">{t('loading.page')}</div>
      </div>
    }>
      <ReservationForm />
    </Suspense>
  );
}
