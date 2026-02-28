// Types de services unifiés pour les pages Services et Réservation
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: string;
  features?: string[];
}

// Services disponibles - correspondance entre les pages Services et Réservation
export const serviceTypes: ServiceType[] = [
  {
    id: "transfert-aibd-dakar",
    name: "Transfert Aéroport",
    description: "Service de transfert vers et depuis l'aéroport AIBD de Dakar. Chauffeurs professionnels, véhicules de luxe, prix compétitifs.",
    icon: "✈️",
    features: [
      "Suivi des vols en temps réel",
      "Accueil personnalisé avec panneau",
      "Véhicules de luxe climatisés",
      "Service 24h/24, 7j/7",
      "Prix compétitifs au Sénégal"
    ]
  },

  {
    id: "chauffeur-prive-dakar",
    name: "Chauffeur Privé Dakar",
    description: "Service de chauffeur privé pour tous vos déplacements dans Dakar et ses environs. Confort et sécurité garantis.",
    icon: "🚗",
    features: [
      "Véhicules de luxe modernes",
      "Chauffeurs professionnels certifiés",
      "Service 24h/24, 7j/7",
      "Réservation instantanée",
      "Prix compétitifs"
    ]
  },
  {
    id: "tours-excursions",
    name: "Tours & Excursions",
    description: "Découvrez Dakar et ses environs avec nos guides-chauffeurs expérimentés pour une expérience unique.",
    icon: "🏛️",
    features: [
      "Guides-chauffeurs multilingues",
      "Itinéraires personnalisables",
      "Arrêts photos inclus",
      "Commentaires historiques",
      "Entrées monuments sur demande"
    ]
  },
  {
    id: "services-vip",
    name: "Services VIP",
    description: "Service ultra-premium avec véhicules d'exception et prestations sur-mesure pour une clientèle exigeante.",
    icon: "👑",
    features: [
      "Véhicules de collection",
      "Butler personnel disponible",
      "Service conciergerie inclus",
      "Sécurité renforcée possible",
      "Prestations 100% personnalisables"
    ]
  },
  {
    id: "mise-a-disposition",
    name: "Mise à Disposition",
    description: "Véhicule et chauffeur à votre disposition pour une durée déterminée avec flexibilité maximale.",
    icon: "⏰",
    features: [
      "Chauffeur dédié exclusivement",
      "Planification flexible en temps réel",
      "Aucun frais de détour",
      "Temps d'attente inclus",
      "Service multi-destinations"
    ]
  },
  {
    id: "autres",
    name: "Autres",
    description: "Spécifiez votre besoin particulier",
    icon: "📝",
    features: [
      "Service sur-mesure",
      "Devis personnalisé",
      "Consultation gratuite"
    ]
  }
];

// Services additionnels pour la réservation
export const additionalServices = [
  { id: "wifi", name: "Wi-Fi Premium" },
  { id: "refreshments", name: "Boissons & Collations" },
  { id: "newspaper", name: "Presse du jour" },
  { id: "child_seat", name: "Siège enfant" },
  { id: "flowers", name: "Bouquet de fleurs" },
  { id: "champagne", name: "Champagne" },
];

// Fonction utilitaire pour obtenir un service par ID
export const getServiceById = (id: string): ServiceType | undefined => {
  return serviceTypes.find(service => service.id === id);
};
