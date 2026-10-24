// Money pages « départ vers l'aéroport » (Petite Côte -> AIBD).
//
// L'intention « je pars de mon hôtel et je dois prendre l'avion » est la plus
// proche de la réservation, et le site n'avait que les pages dans le sens
// arrivée (aibd-saly, aibd-mbour...). Les temps de trajet reprennent ceux des
// pages arrivée, les prix viennent de la grille admin (money-page-booking.ts),
// et les règles (annulation 24 h, péage inclus, majoration de nuit) sont celles
// confirmées par le fondateur : rien d'autre n'est avancé.
import type { MoneyPageDefinition, MoneyPageLocale } from '@/lib/seo-money-pages';

const departureProcess: Record<MoneyPageLocale, string[]> = {
  fr: [
    'Réservez en ligne en indiquant votre vol : nous convenons avec vous de l’heure de prise en charge.',
    'Vous recevez un accusé de réception sur WhatsApp, puis la confirmation de votre chauffeur.',
    'Le chauffeur vous attend à l’adresse convenue et charge vos bagages.',
    'Trajet direct jusqu’au terminal des départs de l’AIBD, prix fixe, péage inclus.',
  ],
  en: [
    'Book online with your flight details: we agree on the pickup time with you.',
    'You receive an acknowledgement on WhatsApp, then your driver’s confirmation.',
    'Your driver waits at the agreed address and loads your luggage.',
    'Direct ride to the AIBD departures terminal, fixed price, tolls included.',
  ],
  es: [
    'Reserve en línea indicando su vuelo: acordamos con usted la hora de recogida.',
    'Recibe un acuse de recibo por WhatsApp y luego la confirmación de su chofer.',
    'El chofer le espera en la dirección acordada y carga su equipaje.',
    'Trayecto directo hasta la terminal de salidas del AIBD, precio fijo, peaje incluido.',
  ],
};

const processHeading: Record<MoneyPageLocale, string> = {
  fr: 'Votre départ, étape par étape',
  en: 'Your departure, step by step',
  es: 'Su salida, paso a paso',
};

/** FAQ communes aux départs, complétées page par page. */
const departureFaqs = (place: Record<MoneyPageLocale, string>) => ({
  fr: [
    {
      question: `Combien coûte le transfert ${place.fr} – AIBD ?`,
      answer: 'Le prix est celui de la grille affichée sur cette page : il s’entend par véhicule et non par personne, péage et carburant inclus. Une majoration de 5 000 FCFA s’applique entre minuit et 5 h, annoncée à la réservation.',
    },
    {
      question: 'Puis-je partir très tôt le matin ?',
      answer: 'Oui, le service fonctionne 24 h/24. Pour une prise en charge entre minuit et 5 h, la majoration de nuit est indiquée avant confirmation.',
    },
    {
      question: 'Puis-je réserver l’arrivée et le départ en même temps ?',
      answer: 'Oui : ajoutez un trajet retour dans le formulaire de réservation. Les deux courses sont enregistrées dans la même demande.',
    },
    {
      question: 'Et si mon vol change ?',
      answer: 'L’annulation est gratuite jusqu’à 24 h avant l’heure prévue. Pour décaler l’heure de prise en charge, écrivez-nous sur WhatsApp avec votre référence de réservation.',
    },
  ],
  en: [
    {
      question: `How much is the ${place.en} – AIBD transfer?`,
      answer: 'The price is the one shown in the rate table on this page: per vehicle, not per person, with tolls and fuel included. A 5,000 FCFA surcharge applies between midnight and 5 am and is shown at booking.',
    },
    {
      question: 'Can I leave very early in the morning?',
      answer: 'Yes, the service runs 24/7. For a pickup between midnight and 5 am, the night surcharge is shown before confirmation.',
    },
    {
      question: 'Can I book my arrival and departure together?',
      answer: 'Yes: add a return ride in the booking form. Both rides are recorded in the same request.',
    },
    {
      question: 'What if my flight changes?',
      answer: 'Cancellation is free up to 24 hours before the scheduled time. To move the pickup time, message us on WhatsApp with your booking reference.',
    },
  ],
  es: [
    {
      question: `¿Cuánto cuesta el traslado ${place.es} – AIBD?`,
      answer: 'El precio es el de la tabla de tarifas de esta página: por vehículo y no por persona, peaje y combustible incluidos. Se aplica un recargo de 5 000 FCFA entre medianoche y las 5 h, indicado al reservar.',
    },
    {
      question: '¿Puedo salir muy temprano por la mañana?',
      answer: 'Sí, el servicio funciona 24 h/24. Para una recogida entre medianoche y las 5 h, el recargo nocturno se indica antes de confirmar.',
    },
    {
      question: '¿Puedo reservar la llegada y la salida a la vez?',
      answer: 'Sí: añada un trayecto de vuelta en el formulario de reserva. Ambos trayectos quedan registrados en la misma solicitud.',
    },
    {
      question: '¿Y si cambia mi vuelo?',
      answer: 'La cancelación es gratuita hasta 24 horas antes de la hora prevista. Para cambiar la hora de recogida, escríbanos por WhatsApp con su referencia de reserva.',
    },
  ],
});

interface DepartureInput {
  slug: string;
  place: Record<MoneyPageLocale, string>;
  travelTime: string;
  /** Heure de départ conseillée pour un vol international à 14 h (3 h avant + trajet max). */
  leaveAt: Record<MoneyPageLocale, string>;
  /** Quartiers / lieux de prise en charge, déjà cités ailleurs sur le site. */
  pickupAreas: Record<MoneyPageLocale, string>;
  titles: Record<MoneyPageLocale, { title: string; description: string; h1: string; intentKeyword: string }>;
  relatedRouteSlugs: string[];
}

function departurePage(input: DepartureInput): MoneyPageDefinition {
  const faqs = departureFaqs(input.place);
  const build = (locale: MoneyPageLocale) => {
    const place = input.place[locale];
    const sections = {
      fr: [
        {
          heading: `À quelle heure partir de ${place} ?`,
          body: `Le trajet ${place} – AIBD prend en général ${input.travelTime} selon l’heure et la circulation. Les compagnies recommandent le plus souvent d’être au terminal 3 heures avant un vol international : pour un vol à 14 h, prévoyez un départ de ${place} ${input.leaveAt.fr}. Nous fixons l’heure de prise en charge avec vous à la réservation.`,
        },
        {
          heading: 'Prise en charge à votre hôtel ou à votre villa',
          body: `Le chauffeur vient vous chercher à l’adresse indiquée (${input.pickupAreas.fr}), aide au chargement des bagages et vous dépose devant le terminal des départs. Berline ou SUV, au choix selon le nombre de passagers et de bagages.`,
        },
      ],
      en: [
        {
          heading: `What time should I leave ${place}?`,
          body: `The ${place} – AIBD ride usually takes ${input.travelTime} depending on the time of day and traffic. Airlines usually recommend being at the terminal 3 hours before an international flight: for a 2 pm flight, plan to leave ${place} ${input.leaveAt.en}. We set the pickup time with you when you book.`,
        },
        {
          heading: 'Pickup at your hotel or villa',
          body: `Your driver picks you up at the address you give (${input.pickupAreas.en}), helps load your luggage and drops you in front of the departures terminal. Sedan or SUV, chosen according to the number of passengers and bags.`,
        },
      ],
      es: [
        {
          heading: `¿A qué hora salir de ${place}?`,
          body: `El trayecto ${place} – AIBD suele durar ${input.travelTime} según la hora y el tráfico. Las aerolíneas suelen recomendar estar en la terminal 3 horas antes de un vuelo internacional: para un vuelo a las 14 h, prevea salir de ${place} ${input.leaveAt.es}. Fijamos con usted la hora de recogida al reservar.`,
        },
        {
          heading: 'Recogida en su hotel o villa',
          body: `El chofer le recoge en la dirección indicada (${input.pickupAreas.es}), le ayuda con el equipaje y le deja frente a la terminal de salidas. Sedán o SUV, a elegir según el número de pasajeros y de maletas.`,
        },
      ],
    }[locale];
    const valuePoints = {
      fr: ['Prise en charge à votre hôtel, résidence ou villa', 'Heure de départ calculée avec vous selon votre vol', 'Prix fixe, péage et carburant inclus', 'Annulation gratuite jusqu’à 24 h avant'],
      en: ['Pickup at your hotel, residence or villa', 'Departure time set with you based on your flight', 'Fixed price, tolls and fuel included', 'Free cancellation up to 24 hours before'],
      es: ['Recogida en su hotel, residencia o villa', 'Hora de salida calculada con usted según su vuelo', 'Precio fijo, peaje y combustible incluidos', 'Cancelación gratuita hasta 24 h antes'],
    }[locale];
    return {
      ...input.titles[locale],
      travelTime: input.travelTime,
      valuePoints,
      aibdProcess: departureProcess[locale],
      processHeading: processHeading[locale],
      sections,
      faqs: faqs[locale],
    };
  };

  return {
    kind: 'route',
    slug: input.slug,
    canonicalPath: `/routes/${input.slug}`,
    translations: { fr: build('fr'), en: build('en'), es: build('es') },
    relatedServiceSlugs: ['transfert-hotel-aibd', 'transfert-aeroport-aibd'],
    relatedRouteSlugs: input.relatedRouteSlugs,
  };
}

export const departureRoutePages: MoneyPageDefinition[] = [
  departurePage({
    slug: 'saly-aibd',
    place: { fr: 'Saly', en: 'Saly', es: 'Saly' },
    travelTime: '60-90 min',
    leaveAt: { fr: 'vers 9 h 30', en: 'around 9:30 am', es: 'hacia las 9:30' },
    pickupAreas: {
      fr: 'Saly Portudal, ses hôtels, résidences et villas',
      en: 'Saly Portudal, its hotels, residences and villas',
      es: 'Saly Portudal, sus hoteles, residencias y villas',
    },
    titles: {
      fr: {
        title: 'Transfert Saly AIBD Prix Fixe 24/7 | Navette Xpress',
        description: 'Transfert privé de Saly à l’aéroport AIBD : prise en charge à votre hôtel ou villa, prix fixe péage inclus, réservation en ligne 24/7.',
        h1: 'Transfert Saly vers l’aéroport AIBD en chauffeur privé',
        intentKeyword: 'transfert saly aibd',
      },
      en: {
        title: 'Saly to AIBD Airport Transfer, Fixed Price | Navette Xpress',
        description: 'Private transfer from Saly to AIBD airport: pickup at your hotel or villa, fixed price with tolls included, 24/7 online booking.',
        h1: 'Saly to AIBD Airport Transfer with a Private Driver',
        intentKeyword: 'saly to aibd transfer',
      },
      es: {
        title: 'Traslado Saly AIBD Precio Fijo 24/7 | Navette Xpress',
        description: 'Traslado privado de Saly al aeropuerto AIBD: recogida en su hotel o villa, precio fijo con peaje incluido, reserva en línea 24/7.',
        h1: 'Traslado de Saly al aeropuerto AIBD con chofer privado',
        intentKeyword: 'traslado saly aibd',
      },
    },
    relatedRouteSlugs: ['aibd-saly', 'somone-aibd'],
  }),
  departurePage({
    slug: 'mbour-aibd',
    place: { fr: 'Mbour', en: 'Mbour', es: 'Mbour' },
    travelTime: '75-110 min',
    leaveAt: { fr: 'vers 9 h', en: 'around 9 am', es: 'hacia las 9:00' },
    pickupAreas: {
      fr: 'Mbour et la Petite Côte sud jusqu’à Nianing',
      en: 'Mbour and the southern Petite Côte down to Nianing',
      es: 'Mbour y el sur de la Petite Côte hasta Nianing',
    },
    titles: {
      fr: {
        title: 'Transfert Mbour AIBD Prix Fixe 24/7 | Navette Xpress',
        description: 'Transfert privé de Mbour à l’aéroport AIBD : prise en charge à votre adresse, prix fixe péage inclus, chauffeur disponible 24/7.',
        h1: 'Transfert Mbour vers l’aéroport AIBD en chauffeur privé',
        intentKeyword: 'transfert mbour aibd',
      },
      en: {
        title: 'Mbour to AIBD Airport Transfer, Fixed Price | Navette Xpress',
        description: 'Private transfer from Mbour to AIBD airport: pickup at your address, fixed price with tolls included, driver available 24/7.',
        h1: 'Mbour to AIBD Airport Transfer with a Private Driver',
        intentKeyword: 'mbour to aibd transfer',
      },
      es: {
        title: 'Traslado Mbour AIBD Precio Fijo 24/7 | Navette Xpress',
        description: 'Traslado privado de Mbour al aeropuerto AIBD: recogida en su dirección, precio fijo con peaje incluido, chofer disponible 24/7.',
        h1: 'Traslado de Mbour al aeropuerto AIBD con chofer privado',
        intentKeyword: 'traslado mbour aibd',
      },
    },
    relatedRouteSlugs: ['aibd-mbour', 'saly-aibd'],
  }),
  departurePage({
    slug: 'somone-aibd',
    place: { fr: 'La Somone', en: 'Somone', es: 'Somone' },
    travelTime: '70-100 min',
    leaveAt: { fr: 'vers 9 h 15', en: 'around 9:15 am', es: 'hacia las 9:15' },
    pickupAreas: {
      fr: 'La Somone, Ngaparou et les résidences du bord de lagune',
      en: 'Somone, Ngaparou and the lagoon-side residences',
      es: 'Somone, Ngaparou y las residencias junto a la laguna',
    },
    titles: {
      fr: {
        title: 'Transfert Somone AIBD Prix Fixe 24/7 | Navette Xpress',
        description: 'Transfert privé de La Somone à l’aéroport AIBD : prise en charge à votre hôtel ou villa, prix fixe péage inclus, réservation 24/7.',
        h1: 'Transfert Somone vers l’aéroport AIBD en chauffeur privé',
        intentKeyword: 'transfert somone aibd',
      },
      en: {
        title: 'Somone to AIBD Airport Transfer, Fixed Price | Navette Xpress',
        description: 'Private transfer from Somone to AIBD airport: pickup at your hotel or villa, fixed price with tolls included, 24/7 booking.',
        h1: 'Somone to AIBD Airport Transfer with a Private Driver',
        intentKeyword: 'somone to aibd transfer',
      },
      es: {
        title: 'Traslado Somone AIBD Precio Fijo 24/7 | Navette Xpress',
        description: 'Traslado privado de Somone al aeropuerto AIBD: recogida en su hotel o villa, precio fijo con peaje incluido, reserva 24/7.',
        h1: 'Traslado de Somone al aeropuerto AIBD con chofer privado',
        intentKeyword: 'traslado somone aibd',
      },
    },
    relatedRouteSlugs: ['aibd-somone', 'saly-aibd'],
  }),
];
