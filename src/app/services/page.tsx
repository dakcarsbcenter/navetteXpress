// src/app/services/page.tsx
import type { Metadata } from 'next';
import ServicesClient from './ServicesClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaBreadcrumb } from '@/lib/schema';
import { serviceTypes } from '@/lib/services';

export const metadata: Metadata = {
    title: 'Nos Services de Transport VIP & Transfert Aéroport Dakar | Navette Xpress',
    description:
        'Découvrez nos services premium au Sénégal : transfert aéroport AIBD 24h/24, chauffeur privé à Dakar, mise à disposition de luxe, et excursions touristiques sur mesure.',
    alternates: { canonical: 'https://navettexpress.com/services' },
    keywords: ['transfert aéroport Dakar', 'chauffeur privé Sénégal', 'VTC Dakar', 'navette AIBD', 'location voiture avec chauffeur Dakar'],
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Services', item: 'https://navettexpress.com/services' },
    ];

    // Map serviceTypes to schema format
    const schemaServices = serviceTypes.filter(s => s.id !== 'autres').map(s => ({
        name: s.name,
        description: s.description,
        url: `https://navettexpress.com/services#${s.id}`,
    }));

    return (
        <>
            <JsonLd data={schemaService(schemaServices[0])} /> {/* Main service focus */}
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <ServicesClient />
        </>
    );
}
