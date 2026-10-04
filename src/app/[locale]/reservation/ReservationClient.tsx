"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Button } from "@/components/ui/Button";
import { BookNowIcon } from "@/components/icons/custom-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Bag, Phone, EnvelopeSimple, ArrowRight, ArrowLeft, ChatCircle, User, Airplane, Plus, ArrowsLeftRight, X } from "@phosphor-icons/react";
import { serviceTypes, additionalServices, getServiceById } from "@/lib/services";
import { useRouter } from "@/i18n/navigation";
import NextLink from "next/link";
import { type RouteNodeKey, getRouteNodeFromName } from "@/lib/route-nodes";
import {
  OTHER_LOCATION_VALUE,
  isRouteCombinationAllowed,
  resolvePrice,
} from "@/lib/pricing";
import { MAX_BOOKING_TRIPS } from "@/lib/booking-trips";
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
  { id: 'saint-louis', name: 'SAINT LOUIS' },
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

/**
 * Un trajet de la demande. Une même soumission peut en porter plusieurs
 * (aller-retour, séjour enchaînant plusieurs transferts) : chacun devient une
 * course à part entière, avec son itinéraire, sa date, son véhicule et son vol.
 * Les coordonnées, le passager tiers, les options et les précisions chauffeur
 * valent pour toute la demande et vivent dans `FormData`.
 */
interface TripRow {
  // Clé React stable : les trajets sont insérés et supprimés au milieu de la liste,
  // l'index ferait suivre l'état du mauvais trajet.
  key: string;
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
  // Vol (transferts aéroport uniquement)
  flightNumber: string;
  airline: string;
  // Secteur tarifaire retenu quand plusieurs tarifs couvrent le même couple de
  // noeuds (ex: DAKAR<->AIBD, un tarif par quartier). null tant que le client n'a
  // pas tranché : sans ce choix aucun prix ferme ne peut être annoncé.
  pricingSegmentId: number | null;
}

/** Ce qui vaut pour toute la demande, quel que soit le nombre de trajets. */
interface FormData {
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
}

let tripKeySeed = 0;
const nextTripKey = () => `trip-${++tripKeySeed}`;

const emptyTrip = (overrides: Partial<TripRow> = {}): TripRow => ({
  key: nextTripKey(),
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
  flightNumber: "",
  airline: "",
  pricingSegmentId: null,
  ...overrides,
});

const EMPTY_FORM_DATA: FormData = {
  additionalServices: [],
  specialRequests: "",
  contactPhone: "",
  clientName: "",
  clientEmail: "",
  bookingFor: "self",
  passengerName: "",
  passengerPhone: "",
};

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
  const [trips, setTrips] = useState<TripRow[]>(() => [emptyTrip()]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Nombre de trajets réellement enregistrés : le formulaire est remis à zéro à la
  // fermeture de la modale, la modale doit garder le compte de ce qui a été envoyé.
  const [submittedTripCount, setSubmittedTripCount] = useState(1);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [dbServices, setDbServices] = useState<DbServiceOption[]>([]);
  const [pricingSegments, setPricingSegments] = useState<PricingSegment[]>([]);

  // Anti-bot : champ piege invisible et horodatage de montage du formulaire. Un robot
  // remplit tous les champs du DOM et poste instantanement. Le serveur ne les exige
  // que pour les demandes anonymes (voir src/lib/security/publicFormGuard.ts).
  const [companyWebsite, setCompanyWebsite] = useState('');
  const formStartedAtRef = useRef(Date.now());

  // Fetch services from DB
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        if (data.success) {
          const services: DbServiceOption[] = data.data || [];
          setDbServices(services);
          // Le service pré-sélectionné peut avoir été désactivé ou renommé en admin :
          // le <select> afficherait alors une valeur vide alors que le trajet porte
          // toujours un slug absent de la liste, et l'étape 1 resterait validable avec
          // un service que le client n'a jamais vu. On retombe sur le premier service.
          if (services.length > 0) {
            setTrips((prev) =>
              prev.map((trip) =>
                services.some((service) => service.slug === trip.serviceType)
                  ? trip
                  : { ...trip, serviceType: services[0].slug }
              )
            );
          }
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

  // Gérer la pré-sélection du formulaire depuis l'URL. Elle décrit une course : elle
  // s'applique au premier trajet, les suivants sont ajoutés à la main par le client.
  useEffect(() => {
    const serviceParam = searchParams?.get('service');
    const pickupParam = searchParams?.get('pickup');
    const destinationParam = searchParams?.get('destination');
    const datetimeParam = searchParams?.get('datetime');
    const passengersParam = searchParams?.get('passengers');

    setTrips(prev => {
      const first = { ...prev[0] };

      if (serviceParam && getServiceById(serviceParam)) {
        first.serviceType = serviceParam;
      }
      if (pickupParam && getRouteNodeFromName(pickupParam)) first.pickupAddress = pickupParam;
      if (destinationParam && getRouteNodeFromName(destinationParam)) first.destinationAddress = destinationParam;
      if (datetimeParam) first.datetime = datetimeParam;
      if (passengersParam) first.passengers = parseInt(passengersParam, 10) || 1;

      if (first.pickupAddress && first.destinationAddress && !isRouteCombinationAllowed(first.pickupAddress, first.destinationAddress)) {
        first.destinationAddress = "";
      }

      return [first, ...prev.slice(1)];
    });
  }, [searchParams]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      // Revenir à "je réserve pour moi" ne doit laisser aucun résidu de passager
      // dans le payload envoyé à l'API.
      if (field === 'bookingFor' && value === 'self') {
        return { ...prev, bookingFor: 'self', passengerName: '', passengerPhone: '' };
      }
      return { ...prev, [field]: value as string | number | boolean | string[] };
    });
  };

  const updateTrip = <K extends keyof TripRow>(key: string, field: K, value: TripRow[K]) => {
    setTrips(prev => prev.map(trip => {
      if (trip.key !== key) return trip;
      // Si on change le type de service, réinitialiser le service personnalisé
      if (field === 'serviceType' && value !== 'autres') {
        return { ...trip, serviceType: value as string, customServiceType: '' };
      }
      return { ...trip, [field]: value };
    }));
  };

  const handleLocationChange = (key: string, field: 'pickupAddress' | 'destinationAddress', value: string) => {
    setTrips(prev => prev.map(trip => {
      if (trip.key !== key) return trip;
      // Le secteur appartient au couple départ/arrivée précédent : le conserver
      // afficherait le tarif d'un trajet que le client vient de quitter.
      const next = { ...trip, [field]: value, pricingSegmentId: null };
      if (next.pickupAddress && next.destinationAddress && !isRouteCombinationAllowed(next.pickupAddress, next.destinationAddress)) {
        if (field === 'pickupAddress') {
          next.destinationAddress = '';
        } else {
          next.pickupAddress = '';
        }
      }
      return next;
    }));
  };

  /**
   * Étape suivante du séjour : on repart du point d'arrivée précédent, en gardant
   * le service, les passagers et le véhicule. La date, elle, est forcément
   * différente — la laisser vide évite de réserver deux courses à la même heure.
   */
  const addTrip = () => {
    setTrips(prev => {
      if (prev.length >= MAX_BOOKING_TRIPS) return prev;
      const last = prev[prev.length - 1];
      const departure = last.destinationAddress === OTHER_LOCATION_VALUE ? '' : last.destinationAddress;
      return [...prev, emptyTrip({
        serviceType: last.serviceType,
        customServiceType: last.customServiceType,
        pickupAddress: departure,
        passengers: last.passengers,
        luggage: last.luggage,
        vehicleType: last.vehicleType,
      })];
    });
  };

  /** Retour : le trajet précédent inversé. C'est le cas d'usage le plus fréquent. */
  const addReturnTrip = () => {
    setTrips(prev => {
      if (prev.length >= MAX_BOOKING_TRIPS) return prev;
      const last = prev[prev.length - 1];
      return [...prev, emptyTrip({
        serviceType: last.serviceType,
        customServiceType: last.customServiceType,
        pickupAddress: last.destinationAddress,
        destinationAddress: last.pickupAddress,
        pickupCustomLocation: last.destinationCustomLocation,
        destinationCustomLocation: last.pickupCustomLocation,
        passengers: last.passengers,
        luggage: last.luggage,
        vehicleType: last.vehicleType,
      })];
    });
  };

  const removeTrip = (key: string) => {
    setTrips(prev => (prev.length <= 1 ? prev : prev.filter(trip => trip.key !== key)));
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
  const handleFlightNumberChange = (key: string, value: string) => {
    setTrips(prev => prev.map(trip => {
      if (trip.key !== key) return trip;
      const next = { ...trip, flightNumber: value };
      const deduced = airlineFromFlightNumber(value)?.name;
      const previouslyDeduced = airlineFromFlightNumber(trip.flightNumber)?.name;
      const airlineIsOurs = !trip.airline.trim() || trip.airline === previouslyDeduced;
      // Une compagnie déduite ne doit pas survivre à un changement de vol : sinon
      // "AF719 / Air France" corrigé en "XX999" partirait avec la mauvaise compagnie.
      if (airlineIsOurs) {
        next.airline = deduced ?? '';
      }
      return next;
    }));
  };

  const addressOf = (trip: TripRow, field: 'pickup' | 'destination') => {
    if (field === 'pickup') {
      return trip.pickupAddress === OTHER_LOCATION_VALUE ? trip.pickupCustomLocation.trim() : trip.pickupAddress;
    }
    return trip.destinationAddress === OTHER_LOCATION_VALUE ? trip.destinationCustomLocation.trim() : trip.destinationAddress;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetchPublicApi('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Un trajet = une course. Le serveur crée une réservation par entrée et les
          // relie par un même booking_group_id quand il y en a plusieurs.
          trips: trips.map((trip, index) => {
            // Extraire date et time du datetime
            const [date, time] = trip.datetime ? trip.datetime.split('T') : ['', ''];
            return {
              serviceType: trip.serviceType,
              customServiceType: trip.customServiceType,
              date,
              time,
              pickupAddress: addressOf(trip, 'pickup'),
              destinationAddress: addressOf(trip, 'destination'),
              passengers: trip.passengers,
              luggage: trip.luggage,
              duration: trip.duration,
              vehicleType: trip.vehicleType,
              // Le montant n'est pas transmis : le serveur le recalcule depuis les tarifs
              // paramétrés (src/app/api/bookings/route.ts). On envoie seulement le secteur
              // retenu, qui désigne lequel des tarifs du trajet a été affiché au client.
              pricingSegmentId: trip.pricingSegmentId,
              flightNumber: tripPricing[index].isAirportTrip ? trip.flightNumber.trim() || undefined : undefined,
              airline: tripPricing[index].isAirportTrip ? trip.airline.trim() || undefined : undefined,
            };
          }),
          additionalServices: formData.additionalServices,
          // Le secteur étant tranché à l'étape 1, le serveur retrouve le montant exact
          // quand un tarif est paramétré. La fourchette autrefois recopiée dans les
          // demandes spéciales n'a plus d'objet : elle polluait la ligne lue par le chauffeur.
          specialRequests: formData.specialRequests,
          contactPhone: formData.contactPhone,
          contactEmail: formData.clientEmail || user?.email || "",
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          passengerName: formData.bookingFor === 'other' ? formData.passengerName.trim() : null,
          passengerPhone: formData.bookingFor === 'other' ? formData.passengerPhone.trim() || null : null,
          userId: user?.id,
          // Champs anti-bot : honeypot invisible + horodatage de montage du
          // formulaire (voir src/lib/security/publicFormGuard.ts)
          companyWebsite,
          formStartedAt: formStartedAtRef.current,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Conversion : réservations réellement enregistrées côté API. Une course par
        // trajet, chacune avec son propre véhicule et son propre tarif.
        trips.forEach((trip, index) => {
          trackBookingSubmitted({
            serviceType: trip.serviceType,
            vehicleType: trip.vehicleType,
            price: tripPricing[index].price ?? undefined,
          });
        });
        setSubmittedTripCount(trips.length);
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

  const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

  const serviceNameOf = (trip: TripRow) => trip.serviceType === "autres"
    ? trip.customServiceType
    : (dbServices.find(s => s.slug === trip.serviceType)?.name ||
      (serviceTypes.find(s => s.id === trip.serviceType)?.translations[locale]?.name ??
        serviceTypes.find(s => s.id === trip.serviceType)?.translations.fr.name) ||
      t('step1.notDefined'));

  /**
   * Tout ce qui se déduit d'un trajet : itinéraire autorisé, tarif, vol, complétude.
   * Calculé pour chacun — un trajet DAKAR→AIBD en berline et son retour en SUV n'ont
   * ni le même secteur ni le même prix.
   *
   * Tarif : les segments de tarifs (paramétrés en admin) correspondant au couple
   * départ/arrivée choisi, dans un sens ou l'autre. La résolution est partagée avec
   * le back-office (src/lib/pricing.ts) pour que l'admin repropose exactement le même tarif
   * quand il corrige le trajet d'une réservation. "Autre" (adresse libre) ou une combinaison
   * sans tarif paramétré ne matche rien — l'admin renseignera le prix manuellement.
   *
   * Certains couples (ex: DAKAR<->AIBD) ont plusieurs tarifs actifs, un par secteur
   * ("Dakar Plateau", "Almadies / Ngor"...). On affichait alors une fourchette, que le
   * client devait accepter sans connaître le montant réel. Le secteur lui est désormais
   * demandé, ce qui rend le prix ferme, affiché avant envoi et persisté sur la réservation.
   */
  const tripPricing = trips.map((trip) => {
    const isInvalidCombination = Boolean(
      trip.pickupAddress && trip.destinationAddress && !isRouteCombinationAllowed(trip.pickupAddress, trip.destinationAddress)
    );

    const priceResolution = resolvePrice(
      pricingSegments,
      trip.pickupAddress,
      trip.destinationAddress,
      trip.vehicleType === 'suv' ? 'suv' : 'berline',
      trip.pricingSegmentId,
    );
    const zoneOptions = priceResolution.alternatives;
    const needsZoneChoice = zoneOptions.length > 1;
    const hasZoneChoice =
      !needsZoneChoice || zoneOptions.some((zone) => zone.segment.id === trip.pricingSegmentId);
    // Tant que le secteur n'est pas tranché, aucun montant n'est annoncé : afficher le tarif
    // d'un secteur non choisi reviendrait à annoncer un prix qui n'est pas celui de la course.
    const price = hasZoneChoice ? priceResolution.price : null;

    // Transfert impliquant l'aéroport AIBD : on propose la saisie du numéro de
    // vol pour permettre le suivi en direct côté client une fois la demande créée.
    const isAirportTrip = Boolean(
      trip.serviceType === DEFAULT_SERVICE_TYPE ||
      getRouteNodeFromName(trip.pickupAddress) === 'AIBD' ||
      getRouteNodeFromName(trip.destinationAddress) === 'AIBD'
    );

    const isComplete = Boolean(
      trip.serviceType &&
      !(trip.serviceType === "autres" && !trip.customServiceType) &&
      trip.pickupAddress &&
      !(trip.pickupAddress === OTHER_LOCATION_VALUE && !trip.pickupCustomLocation.trim()) &&
      trip.destinationAddress &&
      !(trip.destinationAddress === OTHER_LOCATION_VALUE && !trip.destinationCustomLocation.trim()) &&
      !isInvalidCombination &&
      // Le secteur conditionne le montant annoncé : on ne laisse pas avancer sans lui.
      hasZoneChoice &&
      trip.datetime
    );

    return {
      isInvalidCombination,
      zoneOptions,
      needsZoneChoice,
      hasZoneChoice,
      price,
      priceLabel: price === null ? null : formatPrice(price),
      isAirportTrip,
      isComplete,
      displayPickupAddress: trip.pickupAddress === OTHER_LOCATION_VALUE ? trip.pickupCustomLocation : trip.pickupAddress,
      displayDestinationAddress: trip.destinationAddress === OTHER_LOCATION_VALUE ? trip.destinationCustomLocation : trip.destinationAddress,
    };
  });

  const isMultiTrip = trips.length > 1;
  const canAddTrip = trips.length < MAX_BOOKING_TRIPS;
  const pricedCount = tripPricing.filter((trip) => trip.price !== null).length;
  // Le total n'engage que les trajets effectivement tarifés : les autres passeront
  // par un prix fixé en back-office, les additionner donnerait un total faux.
  const estimatedTotal = tripPricing.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const hasInvalidCombination = tripPricing.some((trip) => trip.isInvalidCombination);

  const isStep1Complete = tripPricing.every((trip) => trip.isComplete);

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

  /**
   * Les champs d'un trajet. Rendu à l'identique pour chacun : le client retrouve la
   * même saisie au trajet 3 qu'au trajet 1, et une demande à un seul trajet garde
   * exactement la présentation d'avant.
   */
  const renderTripFields = (trip: TripRow, index: number) => {
    const pricing = tripPricing[index];
    const pickupOptions = locations.filter((loc) => {
      if (!trip.destinationAddress) return true;
      return isRouteCombinationAllowed(loc.name, trip.destinationAddress);
    });
    const destinationOptions = locations.filter((loc) => {
      if (!trip.pickupAddress) return true;
      return isRouteCombinationAllowed(trip.pickupAddress, loc.name);
    });

    return (
      <div key={trip.key} className={isMultiTrip ? "space-y-7 rounded border border-border p-4 sm:p-5" : "space-y-7"}>
        {isMultiTrip && (
          <div className="flex items-center justify-between gap-3 -mt-1">
            <span className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#12100E] uppercase">
              {t('step1.tripLabel', { number: index + 1 })}
            </span>
            <div className="flex items-center gap-3">
              {pricing.priceLabel && (
                <span className="text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#12100E]">{pricing.priceLabel}</span>
              )}
              <button
                type="button"
                onClick={() => removeTrip(trip.key)}
                aria-label={t('step1.removeTrip')}
                title={t('step1.removeTrip')}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-[#6E6A63] hover:border-[#12100E] hover:text-[#12100E] transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* Type de service */}
        <div className="space-y-2">
          <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step1.serviceTypeLabel')}</span>
          <select
            value={trip.serviceType}
            onChange={(e) => updateTrip(trip.key, 'serviceType', e.target.value)}
            className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="" disabled>{t('step1.serviceTypeSelectPlaceholder')}</option>
            {(dbServices.length > 0 ? dbServices : serviceTypes).map((service) => {
              const id = 'slug' in service ? service.slug : service.id;
              const name = 'name' in service ? service.name : (service.translations[locale]?.name ?? service.translations.fr.name);
              return <option key={id} value={id}>{name}</option>;
            })}
          </select>
          {trip.serviceType === "autres" && (
            <input
              type="text"
              value={trip.customServiceType}
              onChange={(e) => updateTrip(trip.key, 'customServiceType', e.target.value)}
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
                  value={trip.pickupAddress}
                  onChange={(e) => handleLocationChange(trip.key, 'pickupAddress', e.target.value)}
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
                  value={trip.pickupAddress}
                  onChange={(e) => updateTrip(trip.key, 'pickupAddress', e.target.value)}
                  placeholder={t('step1.pickupInputPlaceholder')}
                  className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                />
              )}
              {trip.pickupAddress === OTHER_LOCATION_VALUE && (
                <input
                  type="text"
                  value={trip.pickupCustomLocation}
                  onChange={(e) => updateTrip(trip.key, 'pickupCustomLocation', e.target.value)}
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
                  value={trip.destinationAddress}
                  onChange={(e) => handleLocationChange(trip.key, 'destinationAddress', e.target.value)}
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
                  value={trip.destinationAddress}
                  onChange={(e) => updateTrip(trip.key, 'destinationAddress', e.target.value)}
                  placeholder={t('step1.destinationInputPlaceholder')}
                  className="w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                />
              )}
              {trip.destinationAddress === OTHER_LOCATION_VALUE && (
                <input
                  type="text"
                  value={trip.destinationCustomLocation}
                  onChange={(e) => updateTrip(trip.key, 'destinationCustomLocation', e.target.value)}
                  placeholder={t('step1.destinationCustomPlaceholder')}
                  className="mt-2 w-full bg-white border border-border rounded px-3 py-3 text-foreground font-medium placeholder:text-[#a8a199] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              )}
            </div>
          </div>
          {pricing.isInvalidCombination && (
            <p className="text-xs text-[#B8493C] pl-[29px]">
              {t('step1.invalidCombination')}
            </p>
          )}
        </div>

        {/* Secteur tarifaire. Plusieurs tarifs couvrent ce couple de noeuds
            (un par quartier) : sans ce choix, le client ne verrait qu'une
            fourchette et découvrirait le montant réel après la réservation. */}
        {pricing.needsZoneChoice && (
          <div className="space-y-2">
            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">{t('step1.zoneLabel')}</span>
            <div className="bg-white border border-border rounded p-3">
              <select
                value={trip.pricingSegmentId ?? ''}
                onChange={(e) => updateTrip(trip.key, 'pricingSegmentId', e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent text-foreground font-medium focus:outline-none w-full cursor-pointer"
              >
                <option value="">{t('step1.zoneSelectPlaceholder')}</option>
                {pricing.zoneOptions.map((zone) => (
                  <option key={zone.segment.id} value={zone.segment.id}>
                    {zone.label} — {formatPrice(zone.price)}
                  </option>
                ))}
              </select>
            </div>
            {!pricing.hasZoneChoice && (
              <p className="text-xs text-[#6E6A63]">{t('step1.zoneHint')}</p>
            )}
          </div>
        )}

        {/* Date, heure, passagers, bagages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white border border-border rounded p-3 sm:col-span-2">
            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.datetimeLabel')}</span>
            <input
              type="datetime-local"
              value={trip.datetime}
              onChange={(e) => updateTrip(trip.key, 'datetime', e.target.value)}
              className="w-full bg-transparent text-foreground font-medium focus:outline-none"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div className="bg-white border border-border rounded p-3 flex items-center gap-2">
            <Users size={16} weight="light" className="text-[#6E6A63]" />
            <div className="flex-1">
              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step1.passengersLabel')}</span>
              <select
                value={trip.passengers}
                onChange={(e) => updateTrip(trip.key, 'passengers', Number(e.target.value))}
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
                value={trip.luggage}
                onChange={(e) => updateTrip(trip.key, 'luggage', Number(e.target.value))}
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
              const selected = trip.vehicleType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateTrip(trip.key, 'vehicleType', type)}
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
    );
  };

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

              {/* Honeypot : invisible pour un visiteur, rempli par les robots qui
                  completent tous les champs du DOM (voir publicFormGuard.ts) */}
              <div aria-hidden="true" className="absolute w-px h-px -left-[9999px] overflow-hidden">
                <label htmlFor="companyWebsite">Site web de votre societe</label>
                <input
                  id="companyWebsite"
                  name="companyWebsite"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-lg border border-border p-6 sm:p-10">

                {/* Étape 1: Trajet */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
                    <div className="space-y-7">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">{t('step1.title')}</h1>
                        <p className="text-[#3d3a35]">{t('step1.subtitle')}</p>
                      </div>

                      {trips.map((trip, index) => renderTripFields(trip, index))}

                      {/* Un trajet par étape du séjour : le client ne ressaisit ni ses
                          coordonnées ni ses options d'un trajet à l'autre. */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={addTrip}
                            disabled={!canAddTrip}
                            className="flex items-center gap-2 px-4 min-h-[44px] rounded border border-dashed border-[#12100E]/30 text-sm font-medium text-[#3d3a35] hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:hover:border-[#12100E]/30 disabled:hover:text-[#3d3a35]"
                          >
                            <Plus size={16} weight="regular" /> {t('step1.addTrip')}
                          </button>
                          <button
                            type="button"
                            onClick={addReturnTrip}
                            disabled={!canAddTrip}
                            className="flex items-center gap-2 px-4 min-h-[44px] rounded border border-dashed border-[#12100E]/30 text-sm font-medium text-[#3d3a35] hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:hover:border-[#12100E]/30 disabled:hover:text-[#3d3a35]"
                          >
                            <ArrowsLeftRight size={16} weight="regular" /> {t('step1.addReturnTrip')}
                          </button>
                        </div>
                        <p className="text-[11px] text-[#6E6A63]">
                          {canAddTrip ? t('step1.tripsHint') : t('step1.maxTripsReached', { max: MAX_BOOKING_TRIPS })}
                        </p>
                      </div>
                    </div>

                    {/* Estimation */}
                    <div className="space-y-4">
                      <div className="h-40 rounded bg-[#E8DCC8] flex items-end p-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.1em] uppercase text-[#6b6154] bg-[#F7F3EC] px-2 py-1.5 rounded">{t('step1.mapPlaceholder')}</span>
                      </div>
                      <div className="bg-[#12100E] rounded p-6 space-y-3">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#9a938a] uppercase block">{t('step1.requestSummary.label')}</span>
                        {isMultiTrip ? (
                          <>
                            {/* Un montant par trajet : un total seul masquerait qu'une des
                                courses attend encore un prix fixé en back-office. */}
                            <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
                              {trips.map((trip, index) => (
                                <div key={trip.key} className="flex justify-between gap-3">
                                  <span>{t('step1.tripLabel', { number: index + 1 })}</span>
                                  <span className={tripPricing[index].priceLabel ? "text-white text-right" : "text-right"}>
                                    {tripPricing[index].priceLabel ?? (tripPricing[index].needsZoneChoice
                                      ? t('step1.requestSummary.ratePendingZone')
                                      : t('step1.requestSummary.onQuote'))}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="h-px bg-[#2e2b27]" />
                            <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
                              <div className="flex justify-between"><span>{t('step1.requestSummary.toll')}</span><span>{t('step1.requestSummary.included')}</span></div>
                              <div className="flex justify-between"><span>{t('step1.requestSummary.wait')}</span><span>{t('step1.requestSummary.included')}</span></div>
                              <div className="flex justify-between">
                                <span>{t('step1.requestSummary.total')}</span>
                                <span className={pricedCount > 0 ? "text-white" : undefined}>
                                  {pricedCount > 0 ? formatPrice(estimatedTotal) : t('step1.requestSummary.onQuote')}
                                </span>
                              </div>
                            </div>
                            {pricedCount > 0 && pricedCount < trips.length && (
                              <p className="text-[10px] text-[#6E6A63] leading-relaxed">
                                {t('step1.requestSummary.tripsCount', { priced: pricedCount, total: trips.length })}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-white font-medium">{serviceNameOf(trips[0])}</p>
                            <div className="h-px bg-[#2e2b27]" />
                            <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
                              <div className="flex justify-between"><span>{t('step1.requestSummary.toll')}</span><span>{t('step1.requestSummary.included')}</span></div>
                              <div className="flex justify-between"><span>{t('step1.requestSummary.wait')}</span><span>{t('step1.requestSummary.included')}</span></div>
                              <div className="flex justify-between">
                                <span>{t('step1.requestSummary.rate')}</span>
                                <span className={tripPricing[0].priceLabel !== null ? "text-white" : undefined}>
                                  {/* "SUR DEVIS" annoncerait à tort qu'aucun tarif n'existe pour ce
                                      trajet, alors qu'il n'attend que le choix du quartier. */}
                                  {tripPricing[0].priceLabel ?? (tripPricing[0].needsZoneChoice
                                    ? t('step1.requestSummary.ratePendingZone')
                                    : t('step1.requestSummary.onQuote'))}
                                </span>
                              </div>
                            </div>
                            {tripPricing[0].priceLabel !== null && (
                              <p className="text-[10px] text-[#6E6A63] leading-relaxed">
                                {t('step1.requestSummary.estimateNote', { vehicle: trips[0].vehicleType === 'suv' ? t('step1.vehicleTypeSuv') : t('step1.vehicleTypeBerline') })}
                              </p>
                            )}
                          </>
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

                    {/* Le vol se renseigne trajet par trajet : un aller-retour a deux vols,
                        et seules les courses touchant l'AIBD sont concernées. */}
                    {trips.map((trip, index) => tripPricing[index].isAirportTrip && (
                      <div key={trip.key} className="space-y-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block">
                          {isMultiTrip
                            ? `${t('step2.tripSectionLabel', { number: index + 1 })} · ${t('step2.flightSectionLabel')}`
                            : t('step2.flightSectionLabel')}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white border border-border rounded p-3">
                            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase block mb-1">{t('step2.flightNumberLabel')}</span>
                            <Combobox
                              value={trip.flightNumber}
                              onValueChange={(value) => handleFlightNumberChange(trip.key, value)}
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
                              value={trip.airline}
                              onValueChange={(value) => updateTrip(trip.key, 'airline', value)}
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
                    ))}

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

                      {trips.map((trip, index) => (
                        <div key={trip.key} className="space-y-3">
                          {isMultiTrip && (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#12100E] uppercase">
                                {t('step3.summary.tripLabel', { number: index + 1 })}
                              </span>
                              <span className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                                {tripPricing[index].priceLabel ?? t('step3.summary.rateValue')}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col gap-0">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center w-[11px]">
                                <div className="w-[11px] h-[11px] rounded-full bg-accent" />
                                <div className="w-px flex-1 bg-[#12100E]" />
                              </div>
                              <div className="pb-4">
                                <p className="font-medium text-foreground">{tripPricing[index].displayPickupAddress || t('step3.summary.notDefined')}</p>
                                <p className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                                  {trip.datetime ? new Date(trip.datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '--'} · {trip.datetime ? new Date(trip.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className="w-[11px] flex justify-center">
                                <div className="w-[11px] h-[11px] rounded-full bg-[#B4643A]" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{tripPricing[index].displayDestinationAddress || t('step3.summary.notDefined')}</p>
                                <p className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">{trip.passengers === 11 ? '10+' : trip.passengers} {t('step3.summary.passengersUnit', { count: trip.passengers })} · {trip.luggage === 11 ? '10+' : trip.luggage} {t('step3.summary.luggageUnit', { count: trip.luggage })}</p>
                              </div>
                            </div>
                          </div>
                          {isMultiTrip && index < trips.length - 1 && <div className="h-px bg-border" />}
                        </div>
                      ))}

                      <div className="h-px bg-border" />
                      <div className="flex flex-col gap-1.5 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                        {formData.bookingFor === 'other' && formData.passengerName.trim() && (
                          <div className="flex justify-between gap-3"><span>{t('step3.summary.passenger')}</span><span className="text-foreground text-right">{formData.passengerName.trim()}</span></div>
                        )}
                        {!isMultiTrip && (
                          <>
                            <div className="flex justify-between"><span>{t('step3.summary.service')}</span><span className="text-foreground">{serviceNameOf(trips[0])}</span></div>
                            <div className="flex justify-between"><span>{t('step3.summary.vehicle')}</span><span className="text-foreground">{trips[0].vehicleType === 'suv' ? t('step1.vehicleTypeSuv') : t('step1.vehicleTypeBerline')}</span></div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span>{isMultiTrip ? t('step3.summary.total') : t('step3.summary.rate')}</span>
                          <span className="text-foreground">
                            {isMultiTrip
                              ? (pricedCount > 0 ? formatPrice(estimatedTotal) : t('step3.summary.rateValue'))
                              : (tripPricing[0].priceLabel ?? t('step3.summary.rateValue'))}
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
                      disabled={isSubmitting || hasInvalidCombination || !isStep3Complete}
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
            title={submittedTripCount > 1 ? t('success.titleMulti', { count: submittedTripCount }) : t('success.title')}
            message={submittedTripCount > 1 ? t('success.messageMulti', { count: submittedTripCount }) : t('success.message')}
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
                setTrips([emptyTrip()]);
                setFormData(EMPTY_FORM_DATA);
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
