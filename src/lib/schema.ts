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
    telephone: '+221784651302',
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
    // Pas d'aggregateRating ici tant qu'aucun avis n'est affiche sur le site.
    // Google exige que la note declaree soit visible sur la page et reellement
    // collectee ; une note codee en dur expose a une action manuelle
    // "structured data spam". A rebrancher sur la table reviews le jour ou
    // /temoignages affichera les avis.
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

/**
 * JobPosting — eligibilite Google for Jobs (encart emploi dans les SERP).
 *
 * Google impose title / description / datePosted / hiringOrganization /
 * jobLocation. `validThrough` n'est pas obligatoire mais sans lui l'annonce
 * reste indefiniment "ouverte", ce que Google finit par deprioriser ; avec une
 * date depassee elle disparait de l'encart. On la fait donc rouler sur la fin
 * du 2e mois suivant : stable a l'interieur d'un mois donne, et toujours
 * valide tant que le recrutement partenaire reste ouvert.
 *
 * `baseSalary` est volontairement absent : la remuneration depend du volume de
 * courses, on ne declare pas un montant qu'on ne garantit pas.
 */
export const schemaJobPosting = (data: {
    title: string;
    description: string;
    url: string;
    locale: string;
    now?: Date;
}) => {
    const now = data.now ?? new Date();
    const datePosted = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const validThrough = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0));

    return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: data.title,
        description: data.description,
        identifier: {
            '@type': 'PropertyValue',
            name: 'Navette Xpress',
            value: `NX-CHAUFFEUR-PARTENAIRE-${datePosted.getUTCFullYear()}${String(datePosted.getUTCMonth() + 1).padStart(2, '0')}`,
        },
        datePosted: datePosted.toISOString().slice(0, 10),
        validThrough: validThrough.toISOString().slice(0, 10),
        employmentType: 'CONTRACTOR',
        hiringOrganization: {
            '@type': 'Organization',
            name: 'Navette Xpress',
            sameAs: 'https://navettexpress.com',
            logo: 'https://navettexpress.com/icons/logo.png',
        },
        jobLocation: [
            {
                '@type': 'Place',
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Dakar',
                    addressRegion: 'Dakar',
                    addressCountry: 'SN',
                },
            },
            {
                '@type': 'Place',
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Mbour',
                    addressRegion: 'Thies',
                    addressCountry: 'SN',
                },
            },
        ],
        occupationalCategory: '53-3053.00 Shuttle Drivers and Chauffeurs',
        industry: 'Transport de personnes',
        directApply: true,
        url: data.url,
        inLanguage: data.locale,
    };
};
