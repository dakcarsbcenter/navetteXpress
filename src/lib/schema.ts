// src/lib/schema.ts
// Tous les schémas JSON-LD du projet — importer dans les pages concernées

export const schemaLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://navettexpress.com/#business',
    name: 'Navette Xpress',
    description:
        'Service de chauffeur privé premium à Dakar, Sénégal. Spécialisé dans les transferts aéroport AIBD, navettes privées et mise à disposition.',
    url: 'https://navettexpress.com',
    telephone: '+221781319191',
    email: 'contact@navettexpress.com',
    foundingDate: '2023',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Dakar',
        addressLocality: 'Dakar',
        addressRegion: 'Dakar',
        postalCode: 'BP 0000',
        addressCountry: 'SN',
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: 14.7167,
        longitude: -17.4677,
    },
    areaServed: [
        { '@type': 'City', name: 'Dakar', containedIn: { '@type': 'Country', name: 'Sénégal' } },
        { '@type': 'Place', name: 'Aéroport International Blaise Diagne', alternateName: 'AIBD' },
        { '@type': 'City', name: 'Saly' },
        { '@type': 'City', name: 'Mbour' },
    ],
    openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
    },
    priceRange: '$$',
    currenciesAccepted: 'XOF, EUR',
    paymentAccepted: 'Orange Money, Wave, Cash, Bank Transfer',
    image: 'https://navettexpress.com/og/og-default.jpg',
    logo: 'https://navettexpress.com/icons/logo.png',
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '127',
        bestRating: '5',
        worstRating: '1',
    },
    sameAs: [
        'https://www.facebook.com/navettexpress',
        'https://www.instagram.com/navettexpress',
    ],
};

export const schemaWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Navette Xpress',
    url: 'https://navettexpress.com',
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://navettexpress.com/reservation?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
    },
};

export const schemaService = (data?: { name?: string; description?: string; url?: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data?.name || 'Transfert Aéroport AIBD Dakar',
    serviceType: 'Chauffeur privé et transfert aéroport',
    description:
        data?.description || 'Service de transfert entre Dakar et l\'aéroport International Blaise Diagne (AIBD). Prise en charge 24h/24, suivi de vol en temps réel, prix fixe.',
    provider: {
        '@type': 'LocalBusiness',
        name: 'Navette Xpress',
        '@id': 'https://navettexpress.com/#business',
    },
    url: data?.url || 'https://navettexpress.com/services',
    areaServed: {
        '@type': 'City',
        name: 'Dakar',
        containedIn: { '@type': 'Country', name: 'Sénégal' },
    },
    offers: {
        '@type': 'Offer',
        priceCurrency: 'XOF',
        priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: 'XOF',
            description: 'Prix fixe selon le véhicule et la destination',
        },
        availability: 'https://schema.org/InStock',
        validFrom: '2024-01-01',
    },
});

export const schemaFAQ = (faqs: { question: string; answer: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
        },
    })),
});

export const schemaBreadcrumb = (items: { name: string; item: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item,
    })),
});
