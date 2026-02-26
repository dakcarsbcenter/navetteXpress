// src/app/flotte/page.tsx
import type { Metadata } from 'next';
import FleetClient from './FleetClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Flotte de Véhicules de Luxe Dakar | Berlines, SUV & Minibus Navette Xpress',
    description:
        'Découvrez notre flotte d\'exception au Sénégal. Des berlines de luxe aux minibus spacieux, tous nos véhicules sont climatisés, assurés et équipés pour votre confort absolu.',
    alternates: { canonical: 'https://navettexpress.com/flotte' },
    keywords: ['voiture de luxe Dakar', 'minibus Sénégal', 'SUV avec chauffeur Dakar', 'flotte VTC Sénégal', 'véhicule VIP Dakar'],
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Flotte', item: 'https://navettexpress.com/flotte' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <FleetClient />
        </>
    );
}
