export type MoneyPageKind = 'service' | 'route';
export type MoneyPageLocale = 'fr' | 'en' | 'es';

export interface MoneyFaq {
  question: string;
  answer: string;
}

export interface MoneyPageTranslation {
  title: string;
  description: string;
  h1: string;
  intentKeyword: string;
  travelTime: string;
  priceFrom: string;
  valuePoints: string[];
  aibdProcess: string[];
  faqs: MoneyFaq[];
}

export interface MoneyPageDefinition {
  kind: MoneyPageKind;
  slug: string;
  canonicalPath: string;
  translations: Record<MoneyPageLocale, MoneyPageTranslation>;
  relatedServiceSlugs: string[];
  relatedRouteSlugs: string[];
}

const commonAibdProcess: Record<MoneyPageLocale, string[]> = {
  fr: [
    'Confirmation immédiate après réservation (email + WhatsApp).',
    'Suivi du vol en temps réel pour ajuster la prise en charge.',
    'Accueil avec pancarte à la sortie AIBD et assistance bagages.',
    'Trajet direct avec prix fixe confirmé avant départ.',
  ],
  en: [
    'Instant confirmation after booking (email + WhatsApp).',
    'Real-time flight tracking to adjust your pickup time.',
    'Meet & greet with a name board at AIBD arrivals and luggage assistance.',
    'Direct transfer with a fixed price confirmed before departure.',
  ],
  es: [
    'Confirmación inmediata tras la reserva (correo electrónico + WhatsApp).',
    'Seguimiento del vuelo en tiempo real para ajustar la hora de recogida.',
    'Recepción con cartel a la salida del AIBD y asistencia con el equipaje.',
    'Trayecto directo con precio fijo confirmado antes de la salida.',
  ],
};

export const moneyServicePages: MoneyPageDefinition[] = [
  {
    kind: 'service',
    slug: 'transfert-aeroport-aibd',
    canonicalPath: '/services/transfert-aeroport-aibd',
    translations: {
      fr: {
        title: 'Transfert Aéroport AIBD Dakar Prix Fixe 24/7 | Navette Xpress',
        description:
          'Réservez votre transfert AIBD vers Dakar avec chauffeur privé 24/7. Prix fixe, suivi de vol, accueil personnalisé et départ immédiat.',
        h1: 'Transfert Aéroport AIBD Dakar: Prix Fixe et Service 24/7',
        intentKeyword: 'transfert aeroport aibd dakar',
        travelTime: '45-70 min selon trafic',
        priceFrom: 'À partir de 25 000 FCFA',
        valuePoints: ['Prix fixe garanti', 'Service de nuit 24/7', 'Chauffeurs professionnels', 'Véhicules climatisés premium'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Combien coûte un transfert AIBD vers Dakar ?',
            answer: 'Le prix dépend du véhicule et de la zone de dépose, avec un tarif fixe annoncé avant validation de votre réservation.',
          },
          {
            question: 'Que se passe-t-il si mon vol est en retard ?',
            answer: 'Nous suivons votre vol en direct et ajustons automatiquement l’heure de prise en charge sans frais supplémentaires liés au retard du vol.',
          },
          {
            question: 'Puis-je réserver en urgence ?',
            answer: 'Oui, selon disponibilité. Nous recommandons toutefois une réservation anticipée pour garantir le meilleur choix de véhicule.',
          },
        ],
      },
      en: {
        title: 'AIBD Airport Transfer Dakar Fixed Price 24/7 | Navette Xpress',
        description:
          'Book your AIBD airport transfer to Dakar with a private driver, available 24/7. Fixed price, live flight tracking, personal meet & greet and prompt departure.',
        h1: 'AIBD Airport Transfer to Dakar: Fixed Price and 24/7 Service',
        intentKeyword: 'aibd airport transfer dakar',
        travelTime: '45-70 min depending on traffic',
        priceFrom: 'From 25,000 FCFA',
        valuePoints: ['Guaranteed fixed price', '24/7 night service', 'Professional drivers', 'Premium air-conditioned vehicles'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'How much does an AIBD transfer to Dakar cost?',
            answer: 'The price depends on the vehicle and drop-off zone, with a fixed rate quoted before you confirm your booking.',
          },
          {
            question: 'What happens if my flight is delayed?',
            answer: 'We track your flight live and automatically adjust the pickup time, with no extra charge for flight delays.',
          },
          {
            question: 'Can I book at the last minute?',
            answer: 'Yes, subject to availability. However, we recommend booking in advance to guarantee the best choice of vehicle.',
          },
        ],
      },
      es: {
        title: 'Traslado Aeropuerto AIBD Dakar Precio Fijo 24/7 | Navette Xpress',
        description:
          'Reserve su traslado desde el AIBD a Dakar con chofer privado 24/7. Precio fijo, seguimiento de vuelo, recepción personalizada y salida inmediata.',
        h1: 'Traslado Aeropuerto AIBD a Dakar: Precio Fijo y Servicio 24/7',
        intentKeyword: 'traslado aeropuerto aibd dakar',
        travelTime: '45-70 min según el tráfico',
        priceFrom: 'Desde 25.000 FCFA',
        valuePoints: ['Precio fijo garantizado', 'Servicio nocturno 24/7', 'Choferes profesionales', 'Vehículos premium climatizados'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Cuánto cuesta un traslado del AIBD a Dakar?',
            answer: 'El precio depende del vehículo y de la zona de destino, con una tarifa fija indicada antes de confirmar la reserva.',
          },
          {
            question: '¿Qué ocurre si mi vuelo se retrasa?',
            answer: 'Seguimos su vuelo en directo y ajustamos automáticamente la hora de recogida, sin cargo adicional por el retraso del vuelo.',
          },
          {
            question: '¿Puedo reservar de urgencia?',
            answer: 'Sí, según disponibilidad. No obstante, recomendamos reservar con antelación para garantizar la mejor elección de vehículo.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['chauffeur-prive-dakar', 'transfert-hotel-aibd'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-saly'],
  },
  {
    kind: 'service',
    slug: 'chauffeur-prive-dakar',
    canonicalPath: '/services/chauffeur-prive-dakar',
    translations: {
      fr: {
        title: 'Chauffeur Privé Dakar Mise à Disposition 24/7 | Navette Xpress',
        description:
          'Service chauffeur privé à Dakar pour rendez-vous business, city tours et transferts premium. Réservation rapide, prix fixe, disponibilité 24/7.',
        h1: 'Chauffeur Privé Dakar pour Tous Vos Déplacements',
        intentKeyword: 'chauffeur prive dakar',
        travelTime: 'Sur mesure selon itinéraire',
        priceFrom: 'À partir de 20 000 FCFA',
        valuePoints: ['Mise à disposition flexible', 'Facturation claire', 'Confort premium', 'Support client réactif'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Le chauffeur peut-il attendre entre deux rendez-vous ?',
            answer: 'Oui, la mise à disposition inclut l’attente planifiée selon le forfait choisi.',
          },
          {
            question: 'Proposez-vous un service entreprise ?',
            answer: 'Oui, avec options de facturation mensuelle et coordination pour les équipes et visiteurs VIP.',
          },
          {
            question: 'Ce service est-il disponible le week-end ?',
            answer: 'Oui, le service chauffeur privé est disponible 7j/7, y compris les horaires nocturnes.',
          },
        ],
      },
      en: {
        title: 'Private Driver Dakar Chauffeur Service 24/7 | Navette Xpress',
        description:
          'Private driver service in Dakar for business meetings, city tours and premium transfers. Quick booking, fixed price, available 24/7.',
        h1: 'Private Driver in Dakar for All Your Journeys',
        intentKeyword: 'private driver dakar',
        travelTime: 'Tailored to your itinerary',
        priceFrom: 'From 20,000 FCFA',
        valuePoints: ['Flexible chauffeur hire', 'Clear invoicing', 'Premium comfort', 'Responsive customer support'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Can the driver wait between two appointments?',
            answer: 'Yes, chauffeur hire includes scheduled waiting time according to the package chosen.',
          },
          {
            question: 'Do you offer a corporate service?',
            answer: 'Yes, with monthly invoicing options and coordination for teams and VIP visitors.',
          },
          {
            question: 'Is this service available on weekends?',
            answer: 'Yes, the private driver service is available 7 days a week, including nighttime hours.',
          },
        ],
      },
      es: {
        title: 'Chofer Privado Dakar Servicio a su Disposición 24/7 | Navette Xpress',
        description:
          'Servicio de chofer privado en Dakar para citas de negocios, recorridos por la ciudad y traslados premium. Reserva rápida, precio fijo, disponibilidad 24/7.',
        h1: 'Chofer Privado en Dakar para Todos sus Desplazamientos',
        intentKeyword: 'chofer privado dakar',
        travelTime: 'A medida según el itinerario',
        priceFrom: 'Desde 20.000 FCFA',
        valuePoints: ['Disponibilidad flexible', 'Facturación clara', 'Confort premium', 'Atención al cliente reactiva'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Puede el chofer esperar entre dos citas?',
            answer: 'Sí, el servicio a disposición incluye tiempo de espera programado según el paquete elegido.',
          },
          {
            question: '¿Ofrecen un servicio para empresas?',
            answer: 'Sí, con opciones de facturación mensual y coordinación para equipos y visitantes VIP.',
          },
          {
            question: '¿Está disponible este servicio los fines de semana?',
            answer: 'Sí, el servicio de chofer privado está disponible los 7 días de la semana, incluidos los horarios nocturnos.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['mise-a-disposition-chauffeur', 'chauffeur-affaires-dakar'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-thies'],
  },
  {
    kind: 'service',
    slug: 'mise-a-disposition-chauffeur',
    canonicalPath: '/services/mise-a-disposition-chauffeur',
    translations: {
      fr: {
        title: 'Mise à Disposition Chauffeur Dakar Demi-Journée Journée | Navette Xpress',
        description:
          'Réservez un véhicule avec chauffeur privé à Dakar pour quelques heures ou la journée complète. Flexibilité maximale et prix négocié à l’avance.',
        h1: 'Mise à Disposition Chauffeur à Dakar',
        intentKeyword: 'mise a disposition chauffeur dakar',
        travelTime: 'Itinéraire flexible',
        priceFrom: 'À partir de 50 000 FCFA / demi-journée',
        valuePoints: ['Forfaits demi-journée ou journée', 'Gestion multi-arrêts', 'Tarif négocié à l’avance', 'Idéal business et famille'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Quelle est la différence avec un simple transfert ?',
            answer: 'La mise à disposition inclut un chauffeur dédié pendant toute la durée du forfait, avec plusieurs arrêts possibles.',
          },
          {
            question: 'Puis-je prolonger la durée ?',
            answer: 'Oui, sous réserve de disponibilité, avec ajustement transparent du tarif horaire complémentaire.',
          },
          {
            question: 'Ce service convient-il aux délégations ?',
            answer: 'Oui, nous proposons des véhicules adaptés aux groupes et aux déplacements protocolaires.',
          },
        ],
      },
      en: {
        title: 'Chauffeur Hire Dakar Half-Day Full-Day | Navette Xpress',
        description:
          'Book a vehicle with a private driver in Dakar for a few hours or a full day. Maximum flexibility and price agreed in advance.',
        h1: 'Chauffeur Hire in Dakar',
        intentKeyword: 'chauffeur hire dakar',
        travelTime: 'Flexible itinerary',
        priceFrom: 'From 50,000 FCFA / half-day',
        valuePoints: ['Half-day or full-day packages', 'Multiple-stop itineraries', 'Price agreed in advance', 'Ideal for business and family'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: "What's the difference with a simple transfer?",
            answer: 'Chauffeur hire includes a dedicated driver for the entire package duration, with multiple stops possible.',
          },
          {
            question: 'Can I extend the duration?',
            answer: 'Yes, subject to availability, with a transparent adjustment of the additional hourly rate.',
          },
          {
            question: 'Is this service suitable for delegations?',
            answer: 'Yes, we offer vehicles suited to groups and protocol travel.',
          },
        ],
      },
      es: {
        title: 'Chofer a Disposición Dakar Medio Día o Día Completo | Navette Xpress',
        description:
          'Reserve un vehículo con chofer privado en Dakar por unas horas o el día completo. Máxima flexibilidad y precio acordado por adelantado.',
        h1: 'Chofer a Disposición en Dakar',
        intentKeyword: 'chofer a disposición dakar',
        travelTime: 'Itinerario flexible',
        priceFrom: 'Desde 50.000 FCFA / medio día',
        valuePoints: ['Paquetes de medio día o día completo', 'Gestión de múltiples paradas', 'Tarifa acordada por adelantado', 'Ideal para negocios y familia'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Cuál es la diferencia con un simple traslado?',
            answer: 'El servicio a disposición incluye un chofer dedicado durante toda la duración del paquete, con varias paradas posibles.',
          },
          {
            question: '¿Puedo prolongar la duración?',
            answer: 'Sí, según disponibilidad, con un ajuste transparente de la tarifa horaria adicional.',
          },
          {
            question: '¿Es adecuado este servicio para delegaciones?',
            answer: 'Sí, ofrecemos vehículos adaptados a grupos y desplazamientos protocolarios.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['chauffeur-prive-dakar', 'chauffeur-affaires-dakar'],
    relatedRouteSlugs: ['aibd-somone', 'aibd-mbour'],
  },
  {
    kind: 'service',
    slug: 'navette-evenementielle',
    canonicalPath: '/services/navette-evenementielle',
    translations: {
      fr: {
        title: 'Navette Événementielle Mariage Séminaire Dakar | Navette Xpress',
        description:
          'Transport premium pour mariages, conférences, séminaires et délégations à Dakar. Coordination logistique, ponctualité et flotte adaptée.',
        h1: 'Navette Événementielle Dakar: Logistique Fiable et Premium',
        intentKeyword: 'navette evenementielle dakar',
        travelTime: 'Selon programme événementiel',
        priceFrom: 'Devis rapide sous 30 min',
        valuePoints: ['Coordination multi-véhicules', 'Chauffeurs briefés événement', 'Ponctualité stricte', 'Support opérationnel dédié'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Pouvez-vous gérer plusieurs points de ramassage ?',
            answer: 'Oui, nous organisons des plans de ramassage multi-sites avec horaires synchronisés.',
          },
          {
            question: 'Le service inclut-il les transferts depuis AIBD ?',
            answer: 'Oui, nous prenons en charge les participants dès leur arrivée à l’aéroport.',
          },
          {
            question: 'Quand faut-il réserver ?',
            answer: 'Idéalement 5 à 10 jours avant l’événement pour garantir la disponibilité de toute la flotte nécessaire.',
          },
        ],
      },
      en: {
        title: 'Event Shuttle Wedding Seminar Dakar | Navette Xpress',
        description:
          'Premium transport for weddings, conferences, seminars and delegations in Dakar. Logistics coordination, punctuality and a fleet to match your needs.',
        h1: 'Event Shuttle Dakar: Reliable, Premium Logistics',
        intentKeyword: 'event shuttle dakar',
        travelTime: 'Based on the event schedule',
        priceFrom: 'Fast quote within 30 minutes',
        valuePoints: ['Multi-vehicle coordination', 'Drivers briefed on the event', 'Strict punctuality', 'Dedicated operational support'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Can you manage multiple pickup points?',
            answer: 'Yes, we organize multi-site pickup plans with synchronized schedules.',
          },
          {
            question: 'Does the service include transfers from AIBD?',
            answer: 'Yes, we pick up participants as soon as they arrive at the airport.',
          },
          {
            question: 'When should I book?',
            answer: 'Ideally 5 to 10 days before the event to guarantee availability of the entire fleet needed.',
          },
        ],
      },
      es: {
        title: 'Traslado para Eventos Bodas Seminarios Dakar | Navette Xpress',
        description:
          'Transporte premium para bodas, conferencias, seminarios y delegaciones en Dakar. Coordinación logística, puntualidad y flota adaptada.',
        h1: 'Traslado para Eventos en Dakar: Logística Fiable y Premium',
        intentKeyword: 'traslado para eventos dakar',
        travelTime: 'Según el programa del evento',
        priceFrom: 'Presupuesto rápido en 30 minutos',
        valuePoints: ['Coordinación de múltiples vehículos', 'Choferes informados sobre el evento', 'Puntualidad estricta', 'Soporte operativo dedicado'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Pueden gestionar varios puntos de recogida?',
            answer: 'Sí, organizamos planes de recogida en múltiples ubicaciones con horarios sincronizados.',
          },
          {
            question: '¿Incluye el servicio traslados desde el AIBD?',
            answer: 'Sí, recogemos a los participantes desde su llegada al aeropuerto.',
          },
          {
            question: '¿Con cuánta antelación hay que reservar?',
            answer: 'Idealmente entre 5 y 10 días antes del evento para garantizar la disponibilidad de toda la flota necesaria.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['mise-a-disposition-chauffeur', 'transfert-hotel-aibd'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-saint-louis'],
  },
  {
    kind: 'service',
    slug: 'transfert-hotel-aibd',
    canonicalPath: '/services/transfert-hotel-aibd',
    translations: {
      fr: {
        title: 'Transfert Hôtel AIBD Dakar Saly Somone | Navette Xpress',
        description:
          'Transfert aéroport vers hôtels à Dakar, Saly, Somone et Mbour. Accueil AIBD, assistance bagages, prix fixe et réservation instantanée.',
        h1: 'Transfert Hôtel depuis AIBD: Dakar, Saly, Somone, Mbour',
        intentKeyword: 'transfert hotel aibd',
        travelTime: '45 à 120 min selon destination',
        priceFrom: 'À partir de 25 000 FCFA',
        valuePoints: ['Accueil personnalisé AIBD', 'Itinéraires optimisés', 'Prix fixe annoncé', 'Disponibilité 24/7'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Le chauffeur connaît-il mon hôtel ?',
            answer: 'Oui, nos chauffeurs desservent les hôtels majeurs de Dakar et de la Petite Côte.',
          },
          {
            question: 'Puis-je voyager avec beaucoup de bagages ?',
            answer: 'Oui, nous adaptons le véhicule au volume de bagages communiqué lors de la réservation.',
          },
          {
            question: 'Proposez-vous une option aller-retour ?',
            answer: 'Oui, vous pouvez réserver l’aller-retour en une seule commande pour sécuriser vos horaires.',
          },
        ],
      },
      en: {
        title: 'AIBD Hotel Transfer Dakar Saly Somone | Navette Xpress',
        description:
          'Airport transfer to hotels in Dakar, Saly, Somone and Mbour. AIBD meet & greet, luggage assistance, fixed price and instant booking.',
        h1: 'Hotel Transfer from AIBD: Dakar, Saly, Somone, Mbour',
        intentKeyword: 'aibd hotel transfer',
        travelTime: '45 to 120 min depending on destination',
        priceFrom: 'From 25,000 FCFA',
        valuePoints: ['Personal meet & greet at AIBD', 'Optimized routes', 'Fixed price quoted upfront', '24/7 availability'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Does the driver know my hotel?',
            answer: 'Yes, our drivers serve the major hotels in Dakar and the Petite Côte.',
          },
          {
            question: 'Can I travel with a lot of luggage?',
            answer: 'Yes, we match the vehicle to the amount of luggage you specify when booking.',
          },
          {
            question: 'Do you offer a round-trip option?',
            answer: 'Yes, you can book the round trip in a single order to secure your schedule.',
          },
        ],
      },
      es: {
        title: 'Traslado Hotel AIBD Dakar Saly Somone | Navette Xpress',
        description:
          'Traslado desde el aeropuerto a hoteles en Dakar, Saly, Somone y Mbour. Recepción en el AIBD, asistencia con el equipaje, precio fijo y reserva instantánea.',
        h1: 'Traslado al Hotel desde el AIBD: Dakar, Saly, Somone, Mbour',
        intentKeyword: 'traslado hotel aibd',
        travelTime: '45 a 120 min según el destino',
        priceFrom: 'Desde 25.000 FCFA',
        valuePoints: ['Recepción personalizada en el AIBD', 'Rutas optimizadas', 'Precio fijo indicado de antemano', 'Disponibilidad 24/7'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Conoce el chofer mi hotel?',
            answer: 'Sí, nuestros choferes cubren los principales hoteles de Dakar y de la Petite Côte.',
          },
          {
            question: '¿Puedo viajar con mucho equipaje?',
            answer: 'Sí, adaptamos el vehículo al volumen de equipaje indicado al reservar.',
          },
          {
            question: '¿Ofrecen la opción de ida y vuelta?',
            answer: 'Sí, puede reservar el trayecto de ida y vuelta en un solo pedido para asegurar sus horarios.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'navette-evenementielle'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-somone'],
  },
  {
    kind: 'service',
    slug: 'chauffeur-affaires-dakar',
    canonicalPath: '/services/chauffeur-affaires-dakar',
    translations: {
      fr: {
        title: 'Chauffeur Affaires Dakar Service Entreprise Premium | Navette Xpress',
        description:
          'Transport d’affaires à Dakar pour dirigeants, équipes et délégations. Ponctualité, discrétion, facturation entreprise et service VIP.',
        h1: 'Chauffeur Affaires Dakar pour Entreprises et Délégations',
        intentKeyword: 'chauffeur affaires dakar',
        travelTime: 'Optimisé selon agenda professionnel',
        priceFrom: 'Offre entreprise sur devis',
        valuePoints: ['Discrétion absolue', 'Facturation entreprise', 'Planning multi-rendez-vous', 'Support dédié comptes pro'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Pouvez-vous gérer des transferts pour une équipe complète ?',
            answer: 'Oui, nous coordonnons les trajets individuels ou groupes avec un point de contact unique.',
          },
          {
            question: 'Le service est-il adapté aux clients internationaux ?',
            answer: 'Oui, notre process d’accueil AIBD est conçu pour les voyageurs internationaux et délégations.',
          },
          {
            question: 'Quels moyens de paiement entreprises acceptez-vous ?',
            answer: 'Virement bancaire, paiement mobile et facturation périodique selon accord commercial.',
          },
        ],
      },
      en: {
        title: 'Business Chauffeur Dakar Premium Corporate Service | Navette Xpress',
        description:
          'Business transport in Dakar for executives, teams and delegations. Punctuality, discretion, corporate invoicing and VIP service.',
        h1: 'Business Chauffeur in Dakar for Companies and Delegations',
        intentKeyword: 'business chauffeur dakar',
        travelTime: 'Optimized around your business schedule',
        priceFrom: 'Corporate rates on request',
        valuePoints: ['Absolute discretion', 'Corporate invoicing', 'Multi-appointment scheduling', 'Dedicated support for corporate accounts'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Can you manage transfers for a whole team?',
            answer: 'Yes, we coordinate individual or group trips with a single point of contact.',
          },
          {
            question: 'Is the service suited to international clients?',
            answer: 'Yes, our AIBD welcome process is designed for international travelers and delegations.',
          },
          {
            question: 'What corporate payment methods do you accept?',
            answer: 'Bank transfer, mobile payment and periodic invoicing according to the commercial agreement.',
          },
        ],
      },
      es: {
        title: 'Chofer de Negocios Dakar Servicio Corporativo Premium | Navette Xpress',
        description:
          'Transporte de negocios en Dakar para directivos, equipos y delegaciones. Puntualidad, discreción, facturación corporativa y servicio VIP.',
        h1: 'Chofer de Negocios en Dakar para Empresas y Delegaciones',
        intentKeyword: 'chofer de negocios dakar',
        travelTime: 'Optimizado según la agenda profesional',
        priceFrom: 'Oferta corporativa bajo presupuesto',
        valuePoints: ['Discreción absoluta', 'Facturación corporativa', 'Planificación de múltiples citas', 'Soporte dedicado para cuentas corporativas'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Pueden gestionar traslados para un equipo completo?',
            answer: 'Sí, coordinamos los trayectos individuales o grupales con un único punto de contacto.',
          },
          {
            question: '¿Está adaptado el servicio a clientes internacionales?',
            answer: 'Sí, nuestro proceso de recepción en el AIBD está diseñado para viajeros internacionales y delegaciones.',
          },
          {
            question: '¿Qué medios de pago corporativos aceptan?',
            answer: 'Transferencia bancaria, pago móvil y facturación periódica según el acuerdo comercial.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['chauffeur-prive-dakar', 'mise-a-disposition-chauffeur'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-thies'],
  },
  {
    kind: 'service',
    slug: 'transfert-famille-vip-dakar',
    canonicalPath: '/services/transfert-famille-vip-dakar',
    translations: {
      fr: {
        title: 'Transfert Famille VIP Dakar et AIBD Confort Premium | Navette Xpress',
        description:
          'Service transfert famille et VIP à Dakar: véhicules spacieux, siège enfant sur demande, chauffeur privé discret et prix fixe vers/depuis AIBD.',
        h1: 'Transfert Famille et VIP à Dakar avec Chauffeur Privé',
        intentKeyword: 'transfert famille vip dakar',
        travelTime: '45-90 min selon destination',
        priceFrom: 'À partir de 30 000 FCFA',
        valuePoints: ['Véhicules spacieux premium', 'Sièges enfant sur demande', 'Accueil VIP AIBD', 'Tarif fixe sans surprise'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Pouvez-vous fournir des sièges enfant ?',
            answer: 'Oui, indiquez l’âge et le nombre d’enfants lors de la réservation pour préparer les sièges adaptés.',
          },
          {
            question: 'Le service VIP inclut-il un accueil personnalisé ?',
            answer: 'Oui, accueil avec pancarte, assistance bagages et coordination WhatsApp dès l’atterrissage.',
          },
          {
            question: 'Quels paiements acceptez-vous ?',
            answer: 'Orange Money, Wave, espèces et virement selon votre préférence.',
          },
        ],
      },
      en: {
        title: 'Family & VIP Transfer Dakar and AIBD Premium Comfort | Navette Xpress',
        description:
          'Family and VIP transfer service in Dakar: spacious vehicles, child seat on request, discreet private driver and fixed price to/from AIBD.',
        h1: 'Family and VIP Transfer in Dakar with a Private Driver',
        intentKeyword: 'family vip transfer dakar',
        travelTime: '45-90 min depending on destination',
        priceFrom: 'From 30,000 FCFA',
        valuePoints: ['Spacious premium vehicles', 'Child seats on request', 'VIP welcome at AIBD', 'Fixed price, no surprises'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Can you provide child seats?',
            answer: 'Yes, tell us the age and number of children when booking so we can prepare the right seats.',
          },
          {
            question: 'Does the VIP service include a personal welcome?',
            answer: 'Yes, a name-board greeting, luggage assistance and WhatsApp coordination as soon as you land.',
          },
          {
            question: 'What payment methods do you accept?',
            answer: 'Orange Money, Wave, cash and bank transfer, according to your preference.',
          },
        ],
      },
      es: {
        title: 'Traslado Familiar VIP Dakar y AIBD Confort Premium | Navette Xpress',
        description:
          'Servicio de traslado familiar y VIP en Dakar: vehículos espaciosos, silla infantil bajo petición, chofer privado discreto y precio fijo hacia/desde el AIBD.',
        h1: 'Traslado Familiar y VIP en Dakar con Chofer Privado',
        intentKeyword: 'traslado familiar vip dakar',
        travelTime: '45-90 min según el destino',
        priceFrom: 'Desde 30.000 FCFA',
        valuePoints: ['Vehículos premium espaciosos', 'Sillas infantiles bajo petición', 'Recepción VIP en el AIBD', 'Tarifa fija sin sorpresas'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Pueden proporcionar sillas para niños?',
            answer: 'Sí, indique la edad y el número de niños al reservar para preparar las sillas adecuadas.',
          },
          {
            question: '¿Incluye el servicio VIP una recepción personalizada?',
            answer: 'Sí, recepción con cartel, asistencia con el equipaje y coordinación por WhatsApp desde el aterrizaje.',
          },
          {
            question: '¿Qué medios de pago aceptan?',
            answer: 'Orange Money, Wave, efectivo y transferencia bancaria, según su preferencia.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'chauffeur-prive-dakar'],
    relatedRouteSlugs: ['aibd-dakar', 'aibd-saly'],
  },
];

export const moneyRoutePages: MoneyPageDefinition[] = [
  {
    kind: 'route',
    slug: 'aibd-dakar',
    canonicalPath: '/routes/aibd-dakar',
    translations: {
      fr: {
        title: 'AIBD Dakar Transfert Privé Prix Fixe 24/7 | Navette Xpress',
        description:
          'Réservez votre transfert AIBD vers Dakar avec chauffeur privé local. Prix fixe, accueil aéroport, suivi de vol et réservation rapide 24/7.',
        h1: 'Trajet AIBD vers Dakar en Chauffeur Privé',
        intentKeyword: 'transfert aibd dakar',
        travelTime: '45-70 min',
        priceFrom: 'À partir de 25 000 FCFA',
        valuePoints: ['Accueil personnalisé AIBD', 'Prix fixe garanti', 'Disponibilité 24/7', 'Chauffeurs expérimentés Dakar'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Le chauffeur m’attend-il en cas de retard avion ?',
            answer: 'Oui, nous suivons votre vol en direct et ajustons automatiquement l’heure de prise en charge.',
          },
          {
            question: 'Puis-je réserver à la dernière minute ?',
            answer: 'Oui, selon disponibilité opérationnelle. Une réservation anticipée reste recommandée.',
          },
          {
            question: 'Le prix est-il différent la nuit ?',
            answer: 'Le prix est fixe et annoncé avant confirmation, y compris sur les trajets nocturnes.',
          },
        ],
      },
      en: {
        title: 'AIBD to Dakar Private Transfer Fixed Price 24/7 | Navette Xpress',
        description:
          'Book your AIBD to Dakar transfer with a local private driver. Fixed price, airport meet & greet, flight tracking and fast 24/7 booking.',
        h1: 'AIBD to Dakar Route with a Private Driver',
        intentKeyword: 'aibd to dakar transfer',
        travelTime: '45-70 min',
        priceFrom: 'From 25,000 FCFA',
        valuePoints: ['Personal meet & greet at AIBD', 'Guaranteed fixed price', '24/7 availability', 'Experienced Dakar drivers'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Will the driver wait for me if my flight is delayed?',
            answer: 'Yes, we track your flight live and automatically adjust the pickup time.',
          },
          {
            question: 'Can I book at the last minute?',
            answer: 'Yes, subject to operational availability. Booking in advance is still recommended.',
          },
          {
            question: 'Is the price different at night?',
            answer: 'The price is fixed and quoted before confirmation, including for night trips.',
          },
        ],
      },
      es: {
        title: 'AIBD Dakar Traslado Privado Precio Fijo 24/7 | Navette Xpress',
        description:
          'Reserve su traslado del AIBD a Dakar con chofer privado local. Precio fijo, recepción en el aeropuerto, seguimiento de vuelo y reserva rápida 24/7.',
        h1: 'Trayecto AIBD a Dakar en Chofer Privado',
        intentKeyword: 'traslado aibd dakar',
        travelTime: '45-70 min',
        priceFrom: 'Desde 25.000 FCFA',
        valuePoints: ['Recepción personalizada en el AIBD', 'Precio fijo garantizado', 'Disponibilidad 24/7', 'Choferes experimentados en Dakar'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Me espera el chofer si el avión se retrasa?',
            answer: 'Sí, seguimos su vuelo en directo y ajustamos automáticamente la hora de recogida.',
          },
          {
            question: '¿Puedo reservar a última hora?',
            answer: 'Sí, según la disponibilidad operativa. Aun así, se recomienda reservar con antelación.',
          },
          {
            question: '¿Es diferente el precio por la noche?',
            answer: 'El precio es fijo y se indica antes de la confirmación, incluso en los trayectos nocturnos.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'transfert-famille-vip-dakar'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-saly'],
  },
  {
    kind: 'route',
    slug: 'dakar-aibd',
    canonicalPath: '/routes/dakar-aibd',
    translations: {
      fr: {
        title: 'Dakar AIBD Transfert Privé Prix Fixe 24/7 | Navette Xpress',
        description:
          'Réservez votre trajet Dakar vers AIBD avec chauffeur privé. Prix fixe, temps de trajet maîtrisé, prise en charge ponctuelle 24h/24.',
        h1: 'Trajet Dakar vers AIBD en Chauffeur Privé',
        intentKeyword: 'dakar aibd transfert',
        travelTime: '45-70 min',
        priceFrom: 'À partir de 25 000 FCFA',
        valuePoints: ['Départ ponctuel', 'Tarif fixe confirmé', 'Suivi trafic en direct', 'Confort premium'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Quand dois-je partir pour un vol international ?',
            answer: 'Nous recommandons une marge de 4h avant départ de vol, ajustée selon trafic et formalités aéroportuaires.',
          },
          {
            question: 'Le péage est-il inclus ?',
            answer: 'Oui, le prix communiqué inclut les frais de péage selon l’itinéraire standard validé.',
          },
          {
            question: 'Puis-je réserver la veille pour le lendemain ?',
            answer: 'Oui, et même le jour même selon disponibilité en temps réel.',
          },
        ],
      },
      en: {
        title: 'Dakar to AIBD Private Transfer Fixed Price 24/7 | Navette Xpress',
        description:
          'Book your Dakar to AIBD trip with a private driver. Fixed price, controlled journey time, punctual pickup around the clock.',
        h1: 'Dakar to AIBD Route with a Private Driver',
        intentKeyword: 'dakar to aibd transfer',
        travelTime: '45-70 min',
        priceFrom: 'From 25,000 FCFA',
        valuePoints: ['Punctual departure', 'Confirmed fixed rate', 'Live traffic monitoring', 'Premium comfort'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'When should I leave for an international flight?',
            answer: 'We recommend a 4-hour margin before flight departure, adjusted for traffic and airport formalities.',
          },
          {
            question: 'Is the toll included?',
            answer: 'Yes, the quoted price includes toll fees for the standard validated route.',
          },
          {
            question: 'Can I book the day before for the next day?',
            answer: 'Yes, and even on the same day, subject to real-time availability.',
          },
        ],
      },
      es: {
        title: 'Dakar AIBD Traslado Privado Precio Fijo 24/7 | Navette Xpress',
        description:
          'Reserve su trayecto de Dakar al AIBD con chofer privado. Precio fijo, tiempo de trayecto controlado, recogida puntual las 24 horas.',
        h1: 'Trayecto Dakar al AIBD en Chofer Privado',
        intentKeyword: 'traslado dakar aibd',
        travelTime: '45-70 min',
        priceFrom: 'Desde 25.000 FCFA',
        valuePoints: ['Salida puntual', 'Tarifa fija confirmada', 'Seguimiento del tráfico en directo', 'Confort premium'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Cuándo debo salir para un vuelo internacional?',
            answer: 'Recomendamos un margen de 4 horas antes de la salida del vuelo, ajustado según el tráfico y los trámites aeroportuarios.',
          },
          {
            question: '¿Está incluido el peaje?',
            answer: 'Sí, el precio indicado incluye los gastos de peaje según el itinerario estándar validado.',
          },
          {
            question: '¿Puedo reservar el día anterior para el día siguiente?',
            answer: 'Sí, e incluso el mismo día, según la disponibilidad en tiempo real.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'chauffeur-prive-dakar'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-thies'],
  },
  {
    kind: 'route',
    slug: 'aibd-saly',
    canonicalPath: '/routes/aibd-saly',
    translations: {
      fr: {
        title: 'AIBD Saly Transfert Privé Fiable et Rapide | Navette Xpress',
        description:
          'Transfert privé AIBD vers Saly avec chauffeur local expérimenté. Prix fixe, accueil aéroport et trajet confortable vers la Petite Côte.',
        h1: 'Transfert AIBD vers Saly: Confort et Ponctualité',
        intentKeyword: 'aibd saly transfert',
        travelTime: '60-90 min',
        priceFrom: 'À partir de 35 000 FCFA',
        valuePoints: ['Destination touristique prioritaire', 'Accueil AIBD optimisé', 'Véhicules climatisés', 'Tarif sans surprise'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Desservez-vous tous les hôtels de Saly ?',
            answer: 'Oui, nous couvrons les principaux hôtels, résidences et villas de Saly et Ngaparou.',
          },
          {
            question: 'Le service fonctionne-t-il tard le soir ?',
            answer: 'Oui, les transferts de nuit sont assurés 24/7 avec confirmation préalable.',
          },
          {
            question: 'Puis-je demander un siège enfant ?',
            answer: 'Oui, il suffit d’indiquer ce besoin lors de la réservation.',
          },
        ],
      },
      en: {
        title: 'AIBD to Saly Reliable and Fast Private Transfer | Navette Xpress',
        description:
          'Private transfer from AIBD to Saly with an experienced local driver. Fixed price, airport meet & greet and a comfortable ride to the Petite Côte.',
        h1: 'AIBD to Saly Transfer: Comfort and Punctuality',
        intentKeyword: 'aibd saly transfer',
        travelTime: '60-90 min',
        priceFrom: 'From 35,000 FCFA',
        valuePoints: ['Priority tourist destination', 'Streamlined AIBD welcome', 'Air-conditioned vehicles', 'No hidden fees'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Do you serve all hotels in Saly?',
            answer: 'Yes, we cover the main hotels, residences and villas in Saly and Ngaparou.',
          },
          {
            question: 'Does the service run late at night?',
            answer: 'Yes, night transfers are available 24/7 with prior confirmation.',
          },
          {
            question: 'Can I request a child seat?',
            answer: 'Yes, simply mention this need when booking.',
          },
        ],
      },
      es: {
        title: 'AIBD Saly Traslado Privado Fiable y Rápido | Navette Xpress',
        description:
          'Traslado privado del AIBD a Saly con chofer local experimentado. Precio fijo, recepción en el aeropuerto y trayecto cómodo hacia la Petite Côte.',
        h1: 'Traslado AIBD a Saly: Confort y Puntualidad',
        intentKeyword: 'traslado aibd saly',
        travelTime: '60-90 min',
        priceFrom: 'Desde 35.000 FCFA',
        valuePoints: ['Destino turístico prioritario', 'Recepción optimizada en el AIBD', 'Vehículos climatizados', 'Tarifa sin sorpresas'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Cubren todos los hoteles de Saly?',
            answer: 'Sí, cubrimos los principales hoteles, residencias y villas de Saly y Ngaparou.',
          },
          {
            question: '¿Funciona el servicio por la noche?',
            answer: 'Sí, los traslados nocturnos están disponibles 24/7 con confirmación previa.',
          },
          {
            question: '¿Puedo pedir una silla infantil?',
            answer: 'Sí, basta con indicar esta necesidad al reservar.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-hotel-aibd', 'transfert-aeroport-aibd'],
    relatedRouteSlugs: ['aibd-somone', 'aibd-mbour'],
  },
  {
    kind: 'route',
    slug: 'aibd-somone',
    canonicalPath: '/routes/aibd-somone',
    translations: {
      fr: {
        title: 'AIBD Somone Chauffeur Privé Prix Fixe | Navette Xpress',
        description:
          'Trajet AIBD vers Somone en chauffeur privé avec accueil aéroport et service premium. Réservation simple et ponctualité garantie.',
        h1: 'Transfert AIBD vers Somone en Chauffeur Privé',
        intentKeyword: 'aibd somone chauffeur prive',
        travelTime: '70-100 min',
        priceFrom: 'À partir de 38 000 FCFA',
        valuePoints: ['Service idéal pour voyageurs loisirs', 'Trajet direct sans attente', 'Ponctualité mesurée', 'Support WhatsApp'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Pouvez-vous m’attendre à l’arrivée si je passe par la bagagerie ?',
            answer: 'Oui, votre chauffeur reste en coordination avec vous jusqu’à la prise en charge effective.',
          },
          {
            question: 'Combien de passagers peuvent voyager ensemble ?',
            answer: 'Nous proposons berlines, SUV et vans selon la taille du groupe.',
          },
          {
            question: 'Le prix est-il différent selon l’heure ?',
            answer: 'Le tarif est fixé à la réservation pour l’itinéraire validé, y compris les horaires de nuit.',
          },
        ],
      },
      en: {
        title: 'AIBD to Somone Private Driver Fixed Price | Navette Xpress',
        description:
          'AIBD to Somone trip with a private driver, airport meet & greet and premium service. Simple booking and guaranteed punctuality.',
        h1: 'AIBD to Somone Transfer with a Private Driver',
        intentKeyword: 'aibd somone private driver',
        travelTime: '70-100 min',
        priceFrom: 'From 38,000 FCFA',
        valuePoints: ['Ideal for leisure travelers', 'Direct trip with no waiting', 'Measured punctuality', 'WhatsApp support'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Can you wait for me on arrival if I go through baggage claim?',
            answer: 'Yes, your driver stays in contact with you until you are actually picked up.',
          },
          {
            question: 'How many passengers can travel together?',
            answer: 'We offer sedans, SUVs and vans depending on the size of your group.',
          },
          {
            question: 'Does the price change depending on the time?',
            answer: 'The rate is fixed at booking for the validated route, including nighttime hours.',
          },
        ],
      },
      es: {
        title: 'AIBD Somone Chofer Privado Precio Fijo | Navette Xpress',
        description:
          'Trayecto del AIBD a Somone con chofer privado, recepción en el aeropuerto y servicio premium. Reserva sencilla y puntualidad garantizada.',
        h1: 'Traslado AIBD a Somone en Chofer Privado',
        intentKeyword: 'aibd somone chofer privado',
        travelTime: '70-100 min',
        priceFrom: 'Desde 38.000 FCFA',
        valuePoints: ['Ideal para viajeros de ocio', 'Trayecto directo sin esperas', 'Puntualidad medida', 'Soporte por WhatsApp'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Pueden esperarme a la llegada si paso por la recogida de equipaje?',
            answer: 'Sí, su chofer se mantiene en coordinación con usted hasta la recogida efectiva.',
          },
          {
            question: '¿Cuántos pasajeros pueden viajar juntos?',
            answer: 'Ofrecemos berlinas, SUV y furgonetas según el tamaño del grupo.',
          },
          {
            question: '¿Varía el precio según la hora?',
            answer: 'La tarifa queda fijada al reservar para el itinerario validado, incluidos los horarios nocturnos.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-hotel-aibd', 'mise-a-disposition-chauffeur'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-mbour'],
  },
  {
    kind: 'route',
    slug: 'aibd-mbour',
    canonicalPath: '/routes/aibd-mbour',
    translations: {
      fr: {
        title: 'AIBD Mbour Transfert Premium 24/7 | Navette Xpress',
        description:
          'Transfert aéroport AIBD vers Mbour avec chauffeur privé. Service 24/7, prix fixe, assistance bagages et réservation en ligne.',
        h1: 'Trajet AIBD vers Mbour: Transport Privé Fiable',
        intentKeyword: 'aibd mbour transfert prive',
        travelTime: '75-110 min',
        priceFrom: 'À partir de 40 000 FCFA',
        valuePoints: ['Process d’accueil AIBD standardisé', 'Confort longue distance', 'Prix transparent', 'Équipe support réactive'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Est-ce adapté pour un voyage en famille ?',
            answer: 'Oui, nous proposons des véhicules spacieux et options de siège enfant sur demande.',
          },
          {
            question: 'Puis-je payer par Orange Money ?',
            answer: 'Oui, Orange Money, Wave, espèces et virement sont acceptés.',
          },
          {
            question: 'Avez-vous des allers-retours Mbour-AIBD ?',
            answer: 'Oui, l’aller-retour peut être réservé en une seule fois pour simplifier votre organisation.',
          },
        ],
      },
      en: {
        title: 'AIBD to Mbour Premium Transfer 24/7 | Navette Xpress',
        description:
          'AIBD airport transfer to Mbour with a private driver. 24/7 service, fixed price, luggage assistance and online booking.',
        h1: 'AIBD to Mbour Route: Reliable Private Transport',
        intentKeyword: 'aibd mbour private transfer',
        travelTime: '75-110 min',
        priceFrom: 'From 40,000 FCFA',
        valuePoints: ['Standardized AIBD welcome process', 'Long-distance comfort', 'Transparent pricing', 'Responsive support team'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Is this suitable for a family trip?',
            answer: 'Yes, we offer spacious vehicles and child seat options on request.',
          },
          {
            question: 'Can I pay with Orange Money?',
            answer: 'Yes, Orange Money, Wave, cash and bank transfer are all accepted.',
          },
          {
            question: 'Do you offer round trips between Mbour and AIBD?',
            answer: 'Yes, the round trip can be booked in a single order to simplify your planning.',
          },
        ],
      },
      es: {
        title: 'AIBD Mbour Traslado Premium 24/7 | Navette Xpress',
        description:
          'Traslado desde el aeropuerto AIBD a Mbour con chofer privado. Servicio 24/7, precio fijo, asistencia con el equipaje y reserva en línea.',
        h1: 'Trayecto AIBD a Mbour: Transporte Privado Fiable',
        intentKeyword: 'aibd mbour traslado privado',
        travelTime: '75-110 min',
        priceFrom: 'Desde 40.000 FCFA',
        valuePoints: ['Proceso de recepción estandarizado en el AIBD', 'Confort para larga distancia', 'Precio transparente', 'Equipo de soporte reactivo'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Es adecuado para un viaje en familia?',
            answer: 'Sí, ofrecemos vehículos espaciosos y opciones de silla infantil bajo petición.',
          },
          {
            question: '¿Puedo pagar con Orange Money?',
            answer: 'Sí, se aceptan Orange Money, Wave, efectivo y transferencia bancaria.',
          },
          {
            question: '¿Ofrecen ida y vuelta Mbour-AIBD?',
            answer: 'Sí, el trayecto de ida y vuelta se puede reservar de una sola vez para simplificar su organización.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-hotel-aibd', 'navette-evenementielle'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-somone'],
  },
  {
    kind: 'route',
    slug: 'aibd-thies',
    canonicalPath: '/routes/aibd-thies',
    translations: {
      fr: {
        title: 'AIBD Thiès Chauffeur Privé Business et Famille | Navette Xpress',
        description:
          'Besoin d’un transfert AIBD vers Thiès ? Profitez d’un service chauffeur privé rapide, ponctuel et disponible 24/7.',
        h1: 'Transfert AIBD vers Thiès en Toute Sérénité',
        intentKeyword: 'aibd thies chauffeur prive',
        travelTime: '45-75 min',
        priceFrom: 'À partir de 32 000 FCFA',
        valuePoints: ['Trajet optimisé vers Thiès', 'Service professionnel', 'Prix fixe', 'Réseau local fiable'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Le service convient-il aux déplacements professionnels ?',
            answer: 'Oui, cette route est très demandée pour les rendez-vous business entre Thiès et Dakar.',
          },
          {
            question: 'Puis-je modifier mon heure de départ ?',
            answer: 'Oui, toute modification est possible selon disponibilité et délai de préavis.',
          },
          {
            question: 'Y a-t-il un supplément bagages ?',
            answer: 'Non pour les bagages standard. Les besoins volumineux sont validés à l’avance.',
          },
        ],
      },
      en: {
        title: 'AIBD to Thies Private Driver for Business and Family | Navette Xpress',
        description:
          'Need a transfer from AIBD to Thies? Enjoy a fast, punctual private driver service, available 24/7.',
        h1: 'AIBD to Thies Transfer with Total Peace of Mind',
        intentKeyword: 'aibd thies private driver',
        travelTime: '45-75 min',
        priceFrom: 'From 32,000 FCFA',
        valuePoints: ['Optimized route to Thies', 'Professional service', 'Fixed price', 'Reliable local network'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Is the service suited to business travel?',
            answer: 'Yes, this route is in high demand for business meetings between Thies and Dakar.',
          },
          {
            question: 'Can I change my departure time?',
            answer: 'Yes, changes are possible subject to availability and notice period.',
          },
          {
            question: 'Is there a luggage surcharge?',
            answer: 'No, not for standard luggage. Bulky items are validated in advance.',
          },
        ],
      },
      es: {
        title: 'AIBD Thies Chofer Privado Negocios y Familia | Navette Xpress',
        description:
          '¿Necesita un traslado del AIBD a Thies? Disfrute de un servicio de chofer privado rápido, puntual y disponible 24/7.',
        h1: 'Traslado AIBD a Thies con Total Tranquilidad',
        intentKeyword: 'aibd thies chofer privado',
        travelTime: '45-75 min',
        priceFrom: 'Desde 32.000 FCFA',
        valuePoints: ['Ruta optimizada hacia Thies', 'Servicio profesional', 'Precio fijo', 'Red local fiable'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Es adecuado el servicio para desplazamientos profesionales?',
            answer: 'Sí, esta ruta es muy solicitada para citas de negocios entre Thies y Dakar.',
          },
          {
            question: '¿Puedo modificar mi hora de salida?',
            answer: 'Sí, cualquier modificación es posible según la disponibilidad y el plazo de aviso.',
          },
          {
            question: '¿Hay recargo por equipaje?',
            answer: 'No para el equipaje estándar. Las necesidades de mayor volumen se validan de antemano.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['chauffeur-affaires-dakar', 'chauffeur-prive-dakar'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-saint-louis'],
  },
  {
    kind: 'route',
    slug: 'aibd-saint-louis',
    canonicalPath: '/routes/aibd-saint-louis',
    translations: {
      fr: {
        title: 'AIBD Saint-Louis Transfert Longue Distance Sécurisé | Navette Xpress',
        description:
          'Transfert privé AIBD vers Saint-Louis avec chauffeur expérimenté. Longue distance confortable, tarif transparent et assistance complète.',
        h1: 'Transfert AIBD vers Saint-Louis: Longue Distance Premium',
        intentKeyword: 'aibd saint louis transfert',
        travelTime: '3h15-4h15',
        priceFrom: 'À partir de 95 000 FCFA',
        valuePoints: ['Confort longue durée', 'Chauffeurs habitués aux longues routes', 'Prix annoncé à l’avance', 'Support durant tout le trajet'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Faites-vous des pauses pendant le trajet ?',
            answer: 'Oui, des pauses peuvent être planifiées selon votre confort et le type de réservation.',
          },
          {
            question: 'Puis-je réserver pour un groupe ?',
            answer: 'Oui, nous proposons des vans et SUV adaptés aux groupes et bagages volumineux.',
          },
          {
            question: 'Cette route est-elle disponible de nuit ?',
            answer: 'Oui, sous confirmation opérationnelle et selon les conditions de sécurité du trajet.',
          },
        ],
      },
      en: {
        title: 'AIBD to Saint-Louis Secure Long-Distance Transfer | Navette Xpress',
        description:
          'Private transfer from AIBD to Saint-Louis with an experienced driver. Comfortable long-distance travel, transparent pricing and full assistance.',
        h1: 'AIBD to Saint-Louis Transfer: Premium Long-Distance Travel',
        intentKeyword: 'aibd saint louis transfer',
        travelTime: '3h15-4h15',
        priceFrom: 'From 95,000 FCFA',
        valuePoints: ['Long-duration comfort', 'Drivers experienced on long routes', 'Price quoted in advance', 'Support throughout the journey'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Do you make stops during the journey?',
            answer: 'Yes, stops can be planned according to your comfort and the type of booking.',
          },
          {
            question: 'Can I book for a group?',
            answer: 'Yes, we offer vans and SUVs suited to groups and bulky luggage.',
          },
          {
            question: 'Is this route available at night?',
            answer: 'Yes, subject to operational confirmation and the route safety conditions.',
          },
        ],
      },
      es: {
        title: 'AIBD Saint-Louis Traslado Larga Distancia Seguro | Navette Xpress',
        description:
          'Traslado privado del AIBD a Saint-Louis con chofer experimentado. Larga distancia cómoda, tarifa transparente y asistencia completa.',
        h1: 'Traslado AIBD a Saint-Louis: Larga Distancia Premium',
        intentKeyword: 'traslado aibd saint louis',
        travelTime: '3h15-4h15',
        priceFrom: 'Desde 95.000 FCFA',
        valuePoints: ['Confort para larga duración', 'Choferes acostumbrados a rutas largas', 'Precio indicado por adelantado', 'Soporte durante todo el trayecto'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Hacen paradas durante el trayecto?',
            answer: 'Sí, se pueden planificar paradas según su comodidad y el tipo de reserva.',
          },
          {
            question: '¿Puedo reservar para un grupo?',
            answer: 'Sí, ofrecemos furgonetas y SUV adaptados a grupos y equipaje voluminoso.',
          },
          {
            question: '¿Está disponible esta ruta por la noche?',
            answer: 'Sí, sujeto a confirmación operativa y a las condiciones de seguridad del trayecto.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['navette-evenementielle', 'transfert-hotel-aibd'],
    relatedRouteSlugs: ['aibd-thies', 'dakar-aibd'],
  },
  {
    kind: 'route',
    slug: 'aibd-ngaparou',
    canonicalPath: '/routes/aibd-ngaparou',
    translations: {
      fr: {
        title: 'AIBD Ngaparou Transfert Privé et Chauffeur Aéroport | Navette Xpress',
        description:
          'Transfert AIBD vers Ngaparou en chauffeur privé avec accueil aéroport, bagages assistés et tarif fixe. Disponible 24/7.',
        h1: 'Transfert AIBD vers Ngaparou en Chauffeur Privé',
        intentKeyword: 'transfert aibd ngaparou',
        travelTime: '65-95 min',
        priceFrom: 'À partir de 37 000 FCFA',
        valuePoints: ['Route Petite Côte optimisée', 'Prix fixe confirmé', 'Service aéroport 24/7', 'Véhicules climatisés'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Desservez-vous les résidences de Ngaparou ?',
            answer: 'Oui, nous couvrons hôtels, résidences privées et villas sur tout le secteur Ngaparou.',
          },
          {
            question: 'Puis-je réserver un aller-retour ?',
            answer: 'Oui, l’aller-retour peut être réservé en une fois pour bloquer vos horaires.',
          },
          {
            question: 'Avez-vous des SUV pour bagages volumineux ?',
            answer: 'Oui, sélectionnez un SUV ou un van selon le nombre de passagers et bagages.',
          },
        ],
      },
      en: {
        title: 'AIBD to Ngaparou Private Transfer and Airport Driver | Navette Xpress',
        description:
          'AIBD to Ngaparou transfer with a private driver, airport meet & greet, luggage assistance and fixed rate. Available 24/7.',
        h1: 'AIBD to Ngaparou Transfer with a Private Driver',
        intentKeyword: 'aibd ngaparou transfer',
        travelTime: '65-95 min',
        priceFrom: 'From 37,000 FCFA',
        valuePoints: ['Optimized Petite Côte route', 'Confirmed fixed price', '24/7 airport service', 'Air-conditioned vehicles'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Do you serve residences in Ngaparou?',
            answer: 'Yes, we cover hotels, private residences and villas across the entire Ngaparou area.',
          },
          {
            question: 'Can I book a round trip?',
            answer: 'Yes, the round trip can be booked at once to lock in your schedule.',
          },
          {
            question: 'Do you have SUVs for bulky luggage?',
            answer: 'Yes, select an SUV or a van depending on the number of passengers and luggage.',
          },
        ],
      },
      es: {
        title: 'AIBD Ngaparou Traslado Privado y Chofer de Aeropuerto | Navette Xpress',
        description:
          'Traslado del AIBD a Ngaparou con chofer privado, recepción en el aeropuerto, asistencia con el equipaje y tarifa fija. Disponible 24/7.',
        h1: 'Traslado AIBD a Ngaparou en Chofer Privado',
        intentKeyword: 'traslado aibd ngaparou',
        travelTime: '65-95 min',
        priceFrom: 'Desde 37.000 FCFA',
        valuePoints: ['Ruta optimizada hacia la Petite Côte', 'Precio fijo confirmado', 'Servicio de aeropuerto 24/7', 'Vehículos climatizados'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Cubren las residencias de Ngaparou?',
            answer: 'Sí, cubrimos hoteles, residencias privadas y villas en todo el sector de Ngaparou.',
          },
          {
            question: '¿Puedo reservar ida y vuelta?',
            answer: 'Sí, el trayecto de ida y vuelta se puede reservar de una vez para fijar sus horarios.',
          },
          {
            question: '¿Tienen SUV para equipaje voluminoso?',
            answer: 'Sí, seleccione un SUV o una furgoneta según el número de pasajeros y el equipaje.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-hotel-aibd', 'transfert-famille-vip-dakar'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-nianing'],
  },
  {
    kind: 'route',
    slug: 'aibd-nianing',
    canonicalPath: '/routes/aibd-nianing',
    translations: {
      fr: {
        title: 'AIBD Nianing Navette Aéroport et Transfert Privé | Navette Xpress',
        description:
          'Navette aéroport AIBD vers Nianing avec chauffeur privé fiable. Prix fixe, accueil personnalisé et trajet sécurisé vers la Petite Côte.',
        h1: 'Navette AIBD vers Nianing: Service Privé Fiable',
        intentKeyword: 'transfert aibd nianing',
        travelTime: '80-115 min',
        priceFrom: 'À partir de 42 000 FCFA',
        valuePoints: ['Disponibilité continue 24/7', 'Confort longue distance', 'Tarif sans surprise', 'Support WhatsApp dédié'],
        aibdProcess: commonAibdProcess.fr,
        faqs: [
          {
            question: 'Le service est-il disponible pour des arrivées tardives ?',
            answer: 'Oui, nous opérons de jour comme de nuit avec confirmation immédiate.',
          },
          {
            question: 'Pouvez-vous prendre en charge une famille complète ?',
            answer: 'Oui, nous proposons berlines, SUV et vans selon la taille de votre groupe.',
          },
          {
            question: 'Combien de temps dure le trajet ?',
            answer: 'Comptez environ 80 à 115 minutes selon trafic et horaires.',
          },
        ],
      },
      en: {
        title: 'AIBD to Nianing Airport Shuttle and Private Transfer | Navette Xpress',
        description:
          'AIBD airport shuttle to Nianing with a reliable private driver. Fixed price, personal welcome and a secure ride to the Petite Côte.',
        h1: 'AIBD to Nianing Shuttle: Reliable Private Service',
        intentKeyword: 'aibd nianing transfer',
        travelTime: '80-115 min',
        priceFrom: 'From 42,000 FCFA',
        valuePoints: ['Round-the-clock availability', 'Long-distance comfort', 'No hidden fees', 'Dedicated WhatsApp support'],
        aibdProcess: commonAibdProcess.en,
        faqs: [
          {
            question: 'Is the service available for late arrivals?',
            answer: 'Yes, we operate day and night with immediate confirmation.',
          },
          {
            question: 'Can you accommodate an entire family?',
            answer: 'Yes, we offer sedans, SUVs and vans depending on the size of your group.',
          },
          {
            question: 'How long does the trip take?',
            answer: 'Allow around 80 to 115 minutes depending on traffic and time of day.',
          },
        ],
      },
      es: {
        title: 'AIBD Nianing Traslado de Aeropuerto y Transporte Privado | Navette Xpress',
        description:
          'Traslado de aeropuerto AIBD a Nianing con chofer privado fiable. Precio fijo, recepción personalizada y trayecto seguro hacia la Petite Côte.',
        h1: 'Traslado AIBD a Nianing: Servicio Privado Fiable',
        intentKeyword: 'traslado aibd nianing',
        travelTime: '80-115 min',
        priceFrom: 'Desde 42.000 FCFA',
        valuePoints: ['Disponibilidad continua 24/7', 'Confort para larga distancia', 'Tarifa sin sorpresas', 'Soporte dedicado por WhatsApp'],
        aibdProcess: commonAibdProcess.es,
        faqs: [
          {
            question: '¿Está disponible el servicio para llegadas tardías?',
            answer: 'Sí, operamos de día y de noche con confirmación inmediata.',
          },
          {
            question: '¿Pueden atender a una familia completa?',
            answer: 'Sí, ofrecemos berlinas, SUV y furgonetas según el tamaño de su grupo.',
          },
          {
            question: '¿Cuánto dura el trayecto?',
            answer: 'Cuente con unos 80 a 115 minutos según el tráfico y el horario.',
          },
        ],
      },
    },
    relatedServiceSlugs: ['transfert-hotel-aibd', 'transfert-famille-vip-dakar'],
    relatedRouteSlugs: ['aibd-ngaparou', 'aibd-saly'],
  },
];

export const allMoneyPages: MoneyPageDefinition[] = [...moneyServicePages, ...moneyRoutePages];

export function getMoneyServiceBySlug(slug: string): MoneyPageDefinition | undefined {
  return moneyServicePages.find((page) => page.slug === slug);
}

export function getMoneyRouteBySlug(slug: string): MoneyPageDefinition | undefined {
  return moneyRoutePages.find((page) => page.slug === slug);
}

export function toAbsoluteUrl(path: string): string {
  return `https://navettexpress.com${path}`;
}

export function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
