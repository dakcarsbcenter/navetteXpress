export type MoneyPageKind = 'service' | 'route';

export interface MoneyFaq {
  question: string;
  answer: string;
}

export interface MoneyPageDefinition {
  kind: MoneyPageKind;
  slug: string;
  canonicalPath: string;
  title: string;
  description: string;
  h1: string;
  intentKeyword: string;
  travelTime: string;
  priceFrom: string;
  valuePoints: string[];
  aibdProcess: string[];
  faqs: MoneyFaq[];
  relatedServiceSlugs: string[];
  relatedRouteSlugs: string[];
}

const commonAibdProcess = [
  'Confirmation immédiate après réservation (email + WhatsApp).',
  'Suivi du vol en temps réel pour ajuster la prise en charge.',
  'Accueil avec pancarte à la sortie AIBD et assistance bagages.',
  'Trajet direct avec prix fixe confirmé avant départ.',
];

export const moneyServicePages: MoneyPageDefinition[] = [
  {
    kind: 'service',
    slug: 'transfert-aeroport-aibd',
    canonicalPath: '/services/transfert-aeroport-aibd',
    title: 'Transfert Aéroport AIBD Dakar Prix Fixe 24/7 | Navette Xpress',
    description:
      'Réservez votre transfert AIBD vers Dakar avec chauffeur privé 24/7. Prix fixe, suivi de vol, accueil personnalisé et départ immédiat.',
    h1: 'Transfert Aéroport AIBD Dakar: Prix Fixe et Service 24/7',
    intentKeyword: 'transfert aeroport aibd dakar',
    travelTime: '45-70 min selon trafic',
    priceFrom: 'A partir de 25 000 FCFA',
    valuePoints: ['Prix fixe garanti', 'Service de nuit 24/7', 'Chauffeurs professionnels', 'Vehicules climatises premium'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Combien coute un transfert AIBD vers Dakar ?',
        answer: 'Le prix depend du vehicule et de la zone de depose, avec un tarif fixe annonce avant validation de votre reservation.',
      },
      {
        question: 'Que se passe-t-il si mon vol est en retard ?',
        answer: 'Nous suivons votre vol en direct et ajustons automatiquement l heure de prise en charge sans frais supplementaires lies au retard du vol.',
      },
      {
        question: 'Puis-je reserver en urgence ?',
        answer: 'Oui, selon disponibilite. Nous recommandons toutefois une reservation anticipee pour garantir le meilleur choix de vehicule.',
      },
    ],
    relatedServiceSlugs: ['chauffeur-prive-dakar', 'transfert-hotel-aibd'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-saly'],
  },
  {
    kind: 'service',
    slug: 'chauffeur-prive-dakar',
    canonicalPath: '/services/chauffeur-prive-dakar',
    title: 'Chauffeur Prive Dakar Mise a Disposition 24/7 | Navette Xpress',
    description:
      'Service chauffeur prive a Dakar pour rendez-vous business, city tours et transferts premium. Reservation rapide, prix fixe, disponibilite 24/7.',
    h1: 'Chauffeur Prive Dakar pour Tous Vos Deplacements',
    intentKeyword: 'chauffeur prive dakar',
    travelTime: 'Sur mesure selon itineraire',
    priceFrom: 'A partir de 20 000 FCFA',
    valuePoints: ['Mise a disposition flexible', 'Facturation claire', 'Confort premium', 'Support client reactif'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Le chauffeur peut-il attendre entre deux rendez-vous ?',
        answer: 'Oui, la mise a disposition inclut l attente planifiee selon le forfait choisi.',
      },
      {
        question: 'Proposez-vous un service entreprise ?',
        answer: 'Oui, avec options de facturation mensuelle et coordination pour les equipes et visiteurs VIP.',
      },
      {
        question: 'Ce service est-il disponible le week-end ?',
        answer: 'Oui, le service chauffeur prive est disponible 7j/7, y compris les horaires nocturnes.',
      },
    ],
    relatedServiceSlugs: ['mise-a-disposition-chauffeur', 'chauffeur-affaires-dakar'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-thies'],
  },
  {
    kind: 'service',
    slug: 'mise-a-disposition-chauffeur',
    canonicalPath: '/services/mise-a-disposition-chauffeur',
    title: 'Mise a Disposition Chauffeur Dakar Demi-Journee Journee | Navette Xpress',
    description:
      'Reservez un vehicule avec chauffeur prive a Dakar pour quelques heures ou la journee complete. Flexibilite maximale et prix negocie a l avance.',
    h1: 'Mise a Disposition Chauffeur a Dakar',
    intentKeyword: 'mise a disposition chauffeur dakar',
    travelTime: 'Itineraire flexible',
    priceFrom: 'A partir de 50 000 FCFA / demi-journee',
    valuePoints: ['Forfaits demi-journee ou journee', 'Gestion multi-arrets', 'Tarif negocie a l avance', 'Ideal business et famille'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Quelle est la difference avec un simple transfert ?',
        answer: 'La mise a disposition inclut un chauffeur dedie pendant toute la duree du forfait, avec plusieurs arrets possibles.',
      },
      {
        question: 'Puis-je prolonger la duree ?',
        answer: 'Oui, sous reserve de disponibilite, avec ajustement transparent du tarif horaire complementaire.',
      },
      {
        question: 'Ce service convient-il aux delegations ?',
        answer: 'Oui, nous proposons des vehicules adaptes aux groupes et aux deplacements protocolaires.',
      },
    ],
    relatedServiceSlugs: ['chauffeur-prive-dakar', 'chauffeur-affaires-dakar'],
    relatedRouteSlugs: ['aibd-somone', 'aibd-mbour'],
  },
  {
    kind: 'service',
    slug: 'navette-evenementielle',
    canonicalPath: '/services/navette-evenementielle',
    title: 'Navette Evenementielle Mariage Seminaire Dakar | Navette Xpress',
    description:
      'Transport premium pour mariages, conferences, seminaires et delegations a Dakar. Coordination logistique, ponctualite et flotte adaptee.',
    h1: 'Navette Evenementielle Dakar: Logistique Fiable et Premium',
    intentKeyword: 'navette evenementielle dakar',
    travelTime: 'Selon programme evenementiel',
    priceFrom: 'Devis rapide sous 30 min',
    valuePoints: ['Coordination multi-vehicules', 'Chauffeurs briefes evenement', 'Ponctualite stricte', 'Support operationnel dedie'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Pouvez-vous gerer plusieurs points de ramassage ?',
        answer: 'Oui, nous organisons des plans de ramassage multi-sites avec horaires synchronises.',
      },
      {
        question: 'Le service inclut-il les transferts depuis AIBD ?',
        answer: 'Oui, nous prenons en charge les participants des leur arrivee a l aeroport.',
      },
      {
        question: 'Quand faut-il reserver ?',
        answer: 'Idealement 5 a 10 jours avant evenement pour garantir la disponibilite de toute la flotte necessaire.',
      },
    ],
    relatedServiceSlugs: ['mise-a-disposition-chauffeur', 'transfert-hotel-aibd'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-saint-louis'],
  },
  {
    kind: 'service',
    slug: 'transfert-hotel-aibd',
    canonicalPath: '/services/transfert-hotel-aibd',
    title: 'Transfert Hotel AIBD Dakar Saly Somone | Navette Xpress',
    description:
      'Transfert aeroport vers hotels a Dakar, Saly, Somone et Mbour. Accueil AIBD, assistance bagages, prix fixe et reservation instantanee.',
    h1: 'Transfert Hotel depuis AIBD: Dakar, Saly, Somone, Mbour',
    intentKeyword: 'transfert hotel aibd',
    travelTime: '45 a 120 min selon destination',
    priceFrom: 'A partir de 25 000 FCFA',
    valuePoints: ['Accueil personnalise AIBD', 'Itineraires optimises', 'Prix fixe annonce', 'Disponibilite 24/7'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Le chauffeur connait-il mon hotel ?',
        answer: 'Oui, nos chauffeurs desservent les hotels majeurs de Dakar et de la Petite Cote.',
      },
      {
        question: 'Puis-je voyager avec beaucoup de bagages ?',
        answer: 'Oui, nous adaptons le vehicule au volume de bagages communique lors de la reservation.',
      },
      {
        question: 'Proposez-vous une option aller-retour ?',
        answer: 'Oui, vous pouvez reserver l aller-retour en une seule commande pour securiser vos horaires.',
      },
    ],
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'navette-evenementielle'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-somone'],
  },
  {
    kind: 'service',
    slug: 'chauffeur-affaires-dakar',
    canonicalPath: '/services/chauffeur-affaires-dakar',
    title: 'Chauffeur Affaires Dakar Service Entreprise Premium | Navette Xpress',
    description:
      'Transport d affaires a Dakar pour dirigeants, equipes et delegations. Ponctualite, discretion, facturation entreprise et service VIP.',
    h1: 'Chauffeur Affaires Dakar pour Entreprises et Delegations',
    intentKeyword: 'chauffeur affaires dakar',
    travelTime: 'Optimise selon agenda professionnel',
    priceFrom: 'Offre entreprise sur devis',
    valuePoints: ['Discretion absolue', 'Facturation entreprise', 'Planning multi-rendez-vous', 'Support dedie comptes pro'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Pouvez-vous gerer des transferts pour une equipe complete ?',
        answer: 'Oui, nous coordonnons les trajets individuels ou groupes avec un point de contact unique.',
      },
      {
        question: 'Le service est-il adapte aux clients internationaux ?',
        answer: 'Oui, notre process d accueil AIBD est concu pour les voyageurs internationaux et delegations.',
      },
      {
        question: 'Quels moyens de paiement entreprises acceptez-vous ?',
        answer: 'Virement bancaire, paiement mobile et facturation periodique selon accord commercial.',
      },
    ],
    relatedServiceSlugs: ['chauffeur-prive-dakar', 'mise-a-disposition-chauffeur'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-thies'],
  },
  {
    kind: 'service',
    slug: 'transfert-famille-vip-dakar',
    canonicalPath: '/services/transfert-famille-vip-dakar',
    title: 'Transfert Famille VIP Dakar et AIBD Confort Premium | Navette Xpress',
    description:
      'Service transfert famille et VIP a Dakar: vehicules spacieux, siege enfant sur demande, chauffeur prive discret et prix fixe vers/depuis AIBD.',
    h1: 'Transfert Famille et VIP a Dakar avec Chauffeur Prive',
    intentKeyword: 'transfert famille vip dakar',
    travelTime: '45-90 min selon destination',
    priceFrom: 'A partir de 30 000 FCFA',
    valuePoints: ['Vehicules spacieux premium', 'Sieges enfant sur demande', 'Accueil VIP AIBD', 'Tarif fixe sans surprise'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Pouvez-vous fournir des sieges enfant ?',
        answer: 'Oui, indiquez l age et le nombre d enfants lors de la reservation pour preparer les sieges adaptes.',
      },
      {
        question: 'Le service VIP inclut-il un accueil personnalise ?',
        answer: 'Oui, accueil avec pancarte, assistance bagages et coordination WhatsApp des l atterrissage.',
      },
      {
        question: 'Quels paiements acceptez-vous ?',
        answer: 'Orange Money, Wave, especes et virement selon votre preference.',
      },
    ],
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'chauffeur-prive-dakar'],
    relatedRouteSlugs: ['aibd-dakar', 'aibd-saly'],
  },
];

export const moneyRoutePages: MoneyPageDefinition[] = [
  {
    kind: 'route',
    slug: 'aibd-dakar',
    canonicalPath: '/routes/aibd-dakar',
    title: 'AIBD Dakar Transfert Prive Prix Fixe 24/7 | Navette Xpress',
    description:
      'Reservez votre transfert AIBD vers Dakar avec chauffeur prive local. Prix fixe, accueil aeroport, suivi de vol et reservation rapide 24/7.',
    h1: 'Trajet AIBD vers Dakar en Chauffeur Prive',
    intentKeyword: 'transfert aibd dakar',
    travelTime: '45-70 min',
    priceFrom: 'A partir de 25 000 FCFA',
    valuePoints: ['Accueil personnalise AIBD', 'Prix fixe garanti', 'Disponibilite 24/7', 'Chauffeurs experimentes Dakar'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Le chauffeur m attend-il en cas de retard avion ?',
        answer: 'Oui, nous suivons votre vol en direct et ajustons automatiquement l heure de prise en charge.',
      },
      {
        question: 'Puis-je reserver a la derniere minute ?',
        answer: 'Oui, selon disponibilite operationnelle. Une reservation anticipee reste recommandee.',
      },
      {
        question: 'Le prix est-il different la nuit ?',
        answer: 'Le prix est fixe et annonce avant confirmation, y compris sur les trajets nocturnes.',
      },
    ],
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'transfert-famille-vip-dakar'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-saly'],
  },
  {
    kind: 'route',
    slug: 'dakar-aibd',
    canonicalPath: '/routes/dakar-aibd',
    title: 'Dakar AIBD Transfert Prive Prix Fixe 24/7 | Navette Xpress',
    description:
      'Reservez votre trajet Dakar vers AIBD avec chauffeur prive. Prix fixe, temps de trajet maitrise, prise en charge ponctuelle 24h/24.',
    h1: 'Trajet Dakar vers AIBD en Chauffeur Prive',
    intentKeyword: 'dakar aibd transfert',
    travelTime: '45-70 min',
    priceFrom: 'A partir de 25 000 FCFA',
    valuePoints: ['Depart ponctuel', 'Tarif fixe confirme', 'Suivi trafic en direct', 'Confort premium'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Quand dois-je partir pour un vol international ?',
        answer: 'Nous recommandons une marge de 4h avant depart de vol, ajustee selon trafic et formalites aeroportuaires.',
      },
      {
        question: 'Le peage est-il inclus ?',
        answer: 'Oui, le prix communique inclut les frais de peage selon l itineraire standard valide.',
      },
      {
        question: 'Puis-je reserver la veille pour le lendemain ?',
        answer: 'Oui, et meme le jour meme selon disponibilite en temps reel.',
      },
    ],
    relatedServiceSlugs: ['transfert-aeroport-aibd', 'chauffeur-prive-dakar'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-thies'],
  },
  {
    kind: 'route',
    slug: 'aibd-saly',
    canonicalPath: '/routes/aibd-saly',
    title: 'AIBD Saly Transfert Prive Fiable et Rapide | Navette Xpress',
    description:
      'Transfert prive AIBD vers Saly avec chauffeur local experimente. Prix fixe, accueil aeroport et trajet confortable vers la Petite Cote.',
    h1: 'Transfert AIBD vers Saly: Confort et Ponctualite',
    intentKeyword: 'aibd saly transfert',
    travelTime: '60-90 min',
    priceFrom: 'A partir de 35 000 FCFA',
    valuePoints: ['Destination touristique prioritaire', 'Accueil AIBD optimise', 'Vehicules climatises', 'Tarif sans surprise'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Desserviriez-vous tous les hotels de Saly ?',
        answer: 'Oui, nous couvrons les principaux hotels, residences et villas de Saly et Ngaparou.',
      },
      {
        question: 'Le service fonctionne-t-il tard le soir ?',
        answer: 'Oui, les transferts de nuit sont assures 24/7 avec confirmation prealable.',
      },
      {
        question: 'Puis-je demander un siege enfant ?',
        answer: 'Oui, il suffit d indiquer ce besoin lors de la reservation.',
      },
    ],
    relatedServiceSlugs: ['transfert-hotel-aibd', 'transfert-aeroport-aibd'],
    relatedRouteSlugs: ['aibd-somone', 'aibd-mbour'],
  },
  {
    kind: 'route',
    slug: 'aibd-somone',
    canonicalPath: '/routes/aibd-somone',
    title: 'AIBD Somone Chauffeur Prive Prix Fixe | Navette Xpress',
    description:
      'Trajet AIBD vers Somone en chauffeur prive avec accueil aeroport et service premium. Reservation simple et ponctualite garantie.',
    h1: 'Transfert AIBD vers Somone en Chauffeur Prive',
    intentKeyword: 'aibd somone chauffeur prive',
    travelTime: '70-100 min',
    priceFrom: 'A partir de 38 000 FCFA',
    valuePoints: ['Service ideal pour voyageurs loisirs', 'Trajet direct sans attente', 'Ponctualite mesuree', 'Support WhatsApp'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Pouvez-vous m attendre a l arrivee si je passe par la bagagerie ?',
        answer: 'Oui, votre chauffeur reste en coordination avec vous jusqu a la prise en charge effective.',
      },
      {
        question: 'Combien de passagers peuvent voyager ensemble ?',
        answer: 'Nous proposons berlines, SUV et vans selon la taille du groupe.',
      },
      {
        question: 'Le prix est-il different selon l heure ?',
        answer: 'Le tarif est fixe a la reservation pour l itineraire valide, y compris les horaires de nuit.',
      },
    ],
    relatedServiceSlugs: ['transfert-hotel-aibd', 'mise-a-disposition-chauffeur'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-mbour'],
  },
  {
    kind: 'route',
    slug: 'aibd-mbour',
    canonicalPath: '/routes/aibd-mbour',
    title: 'AIBD Mbour Transfert Premium 24/7 | Navette Xpress',
    description:
      'Transfert aeroport AIBD vers Mbour avec chauffeur prive. Service 24/7, prix fixe, assistance bagages et reservation en ligne.',
    h1: 'Trajet AIBD vers Mbour: Transport Prive Fiable',
    intentKeyword: 'aibd mbour transfert prive',
    travelTime: '75-110 min',
    priceFrom: 'A partir de 40 000 FCFA',
    valuePoints: ['Process d accueil AIBD standardise', 'Confort longue distance', 'Prix transparent', 'Equipe support reactive'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Est-ce adapte pour un voyage en famille ?',
        answer: 'Oui, nous proposons des vehicules spacieux et options de siege enfant sur demande.',
      },
      {
        question: 'Puis-je payer par Orange Money ?',
        answer: 'Oui, Orange Money, Wave, especes et virement sont acceptes.',
      },
      {
        question: 'Avez-vous des allers-retours Mbour-AIBD ?',
        answer: 'Oui, l aller-retour peut etre reserve en une seule fois pour simplifier votre organisation.',
      },
    ],
    relatedServiceSlugs: ['transfert-hotel-aibd', 'navette-evenementielle'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-somone'],
  },
  {
    kind: 'route',
    slug: 'aibd-thies',
    canonicalPath: '/routes/aibd-thies',
    title: 'AIBD Thies Chauffeur Prive Business et Famille | Navette Xpress',
    description:
      'Besoin d un transfert AIBD vers Thies ? Profitez d un service chauffeur prive rapide, ponctuel et disponible 24/7.',
    h1: 'Transfert AIBD vers Thies en Toute Serenite',
    intentKeyword: 'aibd thies chauffeur prive',
    travelTime: '45-75 min',
    priceFrom: 'A partir de 32 000 FCFA',
    valuePoints: ['Trajet optimise vers Thies', 'Service professionnel', 'Prix fixe', 'Reseau local fiable'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Le service convient-il aux deplacements professionnels ?',
        answer: 'Oui, cette route est tres demandee pour les rendez-vous business entre Thies et Dakar.',
      },
      {
        question: 'Puis-je modifier mon heure de depart ?',
        answer: 'Oui, toute modification est possible selon disponibilite et delai de preavis.',
      },
      {
        question: 'Y a-t-il un supplement bagages ?',
        answer: 'Non pour les bagages standard. Les besoins volumineux sont valides a l avance.',
      },
    ],
    relatedServiceSlugs: ['chauffeur-affaires-dakar', 'chauffeur-prive-dakar'],
    relatedRouteSlugs: ['dakar-aibd', 'aibd-saint-louis'],
  },
  {
    kind: 'route',
    slug: 'aibd-saint-louis',
    canonicalPath: '/routes/aibd-saint-louis',
    title: 'AIBD Saint-Louis Transfert Longue Distance Securise | Navette Xpress',
    description:
      'Transfert prive AIBD vers Saint-Louis avec chauffeur experimente. Longue distance confortable, tarif transparent et assistance complete.',
    h1: 'Transfert AIBD vers Saint-Louis: Longue Distance Premium',
    intentKeyword: 'aibd saint louis transfert',
    travelTime: '3h15-4h15',
    priceFrom: 'A partir de 95 000 FCFA',
    valuePoints: ['Confort longue duree', 'Chauffeurs habitues aux longues routes', 'Prix annonce a l avance', 'Support durant tout le trajet'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Faites-vous des pauses pendant le trajet ?',
        answer: 'Oui, des pauses peuvent etre planifiees selon votre confort et le type de reservation.',
      },
      {
        question: 'Puis-je reserver pour un groupe ?',
        answer: 'Oui, nous proposons des vans et SUV adaptes aux groupes et bagages volumineux.',
      },
      {
        question: 'Cette route est-elle disponible de nuit ?',
        answer: 'Oui, sous confirmation operationnelle et selon les conditions de securite du trajet.',
      },
    ],
    relatedServiceSlugs: ['navette-evenementielle', 'transfert-hotel-aibd'],
    relatedRouteSlugs: ['aibd-thies', 'dakar-aibd'],
  },
  {
    kind: 'route',
    slug: 'aibd-ngaparou',
    canonicalPath: '/routes/aibd-ngaparou',
    title: 'AIBD Ngaparou Transfert Prive et Chauffeur Aeroport | Navette Xpress',
    description:
      'Transfert AIBD vers Ngaparou en chauffeur prive avec accueil aeroport, bagages assistes et tarif fixe. Disponible 24/7.',
    h1: 'Transfert AIBD vers Ngaparou en Chauffeur Prive',
    intentKeyword: 'transfert aibd ngaparou',
    travelTime: '65-95 min',
    priceFrom: 'A partir de 37 000 FCFA',
    valuePoints: ['Route Petite Cote optimisee', 'Prix fixe confirme', 'Service aeroport 24/7', 'Vehicules climatises'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Desserviriez-vous les residences de Ngaparou ?',
        answer: 'Oui, nous couvrons hotels, residences privees et villas sur tout le secteur Ngaparou.',
      },
      {
        question: 'Puis-je reserver un aller-retour ?',
        answer: 'Oui, l aller-retour peut etre reserve en une fois pour bloquer vos horaires.',
      },
      {
        question: 'Avez-vous des SUV pour bagages volumineux ?',
        answer: 'Oui, selectionnez un SUV ou un van selon le nombre de passagers et bagages.',
      },
    ],
    relatedServiceSlugs: ['transfert-hotel-aibd', 'transfert-famille-vip-dakar'],
    relatedRouteSlugs: ['aibd-saly', 'aibd-nianing'],
  },
  {
    kind: 'route',
    slug: 'aibd-nianing',
    canonicalPath: '/routes/aibd-nianing',
    title: 'AIBD Nianing Navette Aeroport et Transfert Prive | Navette Xpress',
    description:
      'Navette aeroport AIBD vers Nianing avec chauffeur prive fiable. Prix fixe, accueil personnalise et trajet securise vers la Petite Cote.',
    h1: 'Navette AIBD vers Nianing: Service Prive Fiable',
    intentKeyword: 'transfert aibd nianing',
    travelTime: '80-115 min',
    priceFrom: 'A partir de 42 000 FCFA',
    valuePoints: ['Disponibilite continue 24/7', 'Confort longue distance', 'Tarif sans surprise', 'Support WhatsApp dedie'],
    aibdProcess: commonAibdProcess,
    faqs: [
      {
        question: 'Le service est-il disponible pour des arrivees tardives ?',
        answer: 'Oui, nous operons de jour comme de nuit avec confirmation immediate.',
      },
      {
        question: 'Pouvez-vous prendre en charge une famille complete ?',
        answer: 'Oui, nous proposons berlines, SUV et vans selon la taille de votre groupe.',
      },
      {
        question: 'Combien de temps dure le trajet ?',
        answer: 'Comptez environ 80 a 115 minutes selon trafic et horaires.',
      },
    ],
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