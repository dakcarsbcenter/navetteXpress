// Types de services unifiés pour les pages Services et Réservation
export type ServiceLocale = "fr" | "en" | "es";

export interface ServiceTranslation {
  name: string;
  description: string;
  features?: string[];
}

export interface ServiceType {
  id: string;
  icon: string;
  translations: Record<ServiceLocale, ServiceTranslation>;
}

// Services disponibles - correspondance entre les pages Services et Réservation
export const serviceTypes: ServiceType[] = [
  {
    id: "transfert-aibd-dakar",
    icon: "✈️",
    translations: {
      fr: {
        name: "Transfert Aéroport",
        description:
          "Service de transfert vers et depuis l'aéroport AIBD de Dakar. Chauffeurs professionnels, véhicules confortables, prix compétitifs.",
        features: [
          "Suivi des vols en temps réel",
          "Accueil personnalisé avec panneau",
          "Véhicules climatisés",
          "Service 24h/24, 7j/7",
          "Prix compétitifs au Sénégal",
        ],
      },
      en: {
        name: "Airport Transfer",
        description:
          "Transfer service to and from Dakar's AIBD airport. Professional drivers, comfortable vehicles, competitive prices.",
        features: [
          "Real-time flight tracking",
          "Personalized welcome with name board",
          "Air-conditioned vehicles",
          "Service available 24/7",
          "Competitive rates in Senegal",
        ],
      },
      es: {
        name: "Traslado al Aeropuerto",
        description:
          "Servicio de traslado hacia y desde el aeropuerto AIBD de Dakar. Choferes profesionales, vehículos cómodos, precios competitivos.",
        features: [
          "Seguimiento de vuelos en tiempo real",
          "Recepción personalizada con cartel",
          "Vehículos con aire acondicionado",
          "Servicio disponible 24/7",
          "Precios competitivos en Senegal",
        ],
      },
    },
  },
  {
    id: "chauffeur-prive-dakar",
    icon: "🚗",
    translations: {
      fr: {
        name: "Chauffeur Privé Dakar",
        description:
          "Service de chauffeur privé pour tous vos déplacements dans Dakar et ses environs. Confort et sécurité.",
        features: [
          "Véhicules modernes",
          "Chauffeurs professionnels",
          "Service 24h/24, 7j/7",
          "Réservation instantanée",
          "Prix compétitifs",
        ],
      },
      en: {
        name: "Private Driver Dakar",
        description:
          "Private chauffeur service for all your journeys in Dakar and the surrounding area. Comfort and safety.",
        features: [
          "Modern vehicles",
          "Professional drivers",
          "Service available 24/7",
          "Instant booking",
          "Competitive rates",
        ],
      },
      es: {
        name: "Chofer Privado Dakar",
        description:
          "Servicio de chofer privado para todos sus desplazamientos en Dakar y alrededores. Comodidad y seguridad.",
        features: [
          "Vehículos modernos",
          "Choferes profesionales",
          "Servicio disponible 24/7",
          "Reserva instantánea",
          "Precios competitivos",
        ],
      },
    },
  },
  {
    id: "tours-excursions",
    icon: "🏛️",
    translations: {
      fr: {
        name: "Tours & Excursions",
        description:
          "Découvrez Dakar et ses environs avec nos guides-chauffeurs expérimentés pour une expérience unique.",
        features: [
          "Guides-chauffeurs multilingues",
          "Itinéraires personnalisables",
          "Arrêts photos inclus",
          "Commentaires historiques",
          "Entrées monuments sur demande",
        ],
      },
      en: {
        name: "Tours & Excursions",
        description:
          "Discover Dakar and its surroundings with our experienced guide-drivers for a unique experience.",
        features: [
          "Multilingual guide-drivers",
          "Customizable itineraries",
          "Photo stops included",
          "Historical commentary",
          "Monument entry fees on request",
        ],
      },
      es: {
        name: "Tours y Excursiones",
        description:
          "Descubra Dakar y sus alrededores con nuestros guías-choferes experimentados para una experiencia única.",
        features: [
          "Guías-choferes multilingües",
          "Itinerarios personalizables",
          "Paradas fotográficas incluidas",
          "Comentarios históricos",
          "Entradas a monumentos a solicitud",
        ],
      },
    },
  },
  {
    id: "services-vip",
    icon: "🧭",
    translations: {
      fr: {
        name: "Service sur mesure",
        description:
          "Une demande particulière ? Décrivez votre besoin, nous vous répondons avec une proposition adaptée.",
        features: [
          "Devis personnalisé",
          "Trajets multiples ou groupes",
          "Facturation entreprise possible",
        ],
      },
      en: {
        name: "Tailor-made Service",
        description:
          "A special request? Describe what you need and we will come back with a suitable proposal.",
        features: [
          "Personalised quote",
          "Multiple trips or groups",
          "Corporate invoicing available",
        ],
      },
      es: {
        name: "Servicio a medida",
        description:
          "¿Una solicitud especial? Describa lo que necesita y le responderemos con una propuesta adaptada.",
        features: [
          "Presupuesto personalizado",
          "Varios trayectos o grupos",
          "Facturación a empresas disponible",
        ],
      },
    },
  },
  {
    id: "mise-a-disposition",
    icon: "⏰",
    translations: {
      fr: {
        name: "Mise à Disposition",
        description:
          "Véhicule et chauffeur à votre disposition pour une durée déterminée avec flexibilité maximale.",
        features: [
          "Chauffeur dédié exclusivement",
          "Planification flexible en temps réel",
          "Aucun frais de détour",
          "Temps d'attente inclus",
          "Service multi-destinations",
        ],
      },
      en: {
        name: "Chauffeur at Disposal",
        description:
          "Vehicle and driver at your disposal for a set duration, with maximum flexibility.",
        features: [
          "Exclusively dedicated driver",
          "Flexible real-time planning",
          "No detour fees",
          "Waiting time included",
          "Multi-destination service",
        ],
      },
      es: {
        name: "Chofer a Disposición",
        description:
          "Vehículo y chofer a su disposición durante un período determinado, con máxima flexibilidad.",
        features: [
          "Chofer exclusivamente dedicado",
          "Planificación flexible en tiempo real",
          "Sin cargos por desvíos",
          "Tiempo de espera incluido",
          "Servicio multidestino",
        ],
      },
    },
  },
  {
    id: "autres",
    icon: "📝",
    translations: {
      fr: {
        name: "Autres",
        description: "Spécifiez votre besoin particulier",
        features: [
          "Service sur-mesure",
          "Devis personnalisé",
          "Consultation gratuite",
        ],
      },
      en: {
        name: "Other",
        description: "Tell us about your specific need",
        features: [
          "Tailor-made service",
          "Personalized quote",
          "Free consultation",
        ],
      },
      es: {
        name: "Otros",
        description: "Indíquenos su necesidad específica",
        features: [
          "Servicio a medida",
          "Presupuesto personalizado",
          "Consulta gratuita",
        ],
      },
    },
  },
];

// Services additionnels pour la réservation
export interface AdditionalService {
  id: string;
  translations: Record<ServiceLocale, { name: string }>;
}

export const additionalServices: AdditionalService[] = [
  {
    id: "refreshments",
    translations: {
      fr: { name: "Boissons & Collations" },
      en: { name: "Drinks & Snacks" },
      es: { name: "Bebidas y Refrigerios" },
    },
  },
  {
    id: "newspaper",
    translations: {
      fr: { name: "Presse du jour" },
      en: { name: "Daily Newspaper" },
      es: { name: "Prensa del día" },
    },
  },
  {
    id: "child_seat",
    translations: {
      fr: { name: "Siège enfant" },
      en: { name: "Child Seat" },
      es: { name: "Silla para niños" },
    },
  },
  {
    id: "flowers",
    translations: {
      fr: { name: "Bouquet de fleurs" },
      en: { name: "Flower Bouquet" },
      es: { name: "Ramo de flores" },
    },
  },
  {
    id: "champagne",
    translations: {
      fr: { name: "Champagne" },
      en: { name: "Champagne" },
      es: { name: "Champán" },
    },
  },
];

// Fonction utilitaire pour obtenir un service par ID
export const getServiceById = (id: string): ServiceType | undefined => {
  return serviceTypes.find((service) => service.id === id);
};
