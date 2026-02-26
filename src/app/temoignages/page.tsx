// src/app/temoignages/page.tsx
import type { Metadata } from 'next';
import TestimonialsClient from './TestimonialsClient';

import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Avis Clients — Note 4.9/5 sur 1000+ Transferts | Navette Xpress Dakar',
    description:
        'Lisez les avis de nos clients satisfaits. Note 4.9/5 sur plus de 1000 transferts aéroport AIBD et navettes à Dakar. Service fiable, ponctuel et professionnel.',
    alternates: { canonical: 'https://navettexpress.com/temoignages' },
    openGraph: {
        title: 'Avis Clients Navette Xpress — 4.9/5 sur 1000+ trajets',
        description: '1000+ clients satisfaits à Dakar. Chauffeur privé ponctuel, prix fixe, véhicules premium.',
        url: 'https://navettexpress.com/temoignages',
    },
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Témoignages', item: 'https://navettexpress.com/temoignages' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <TestimonialsClient />
        </>
    );
}
