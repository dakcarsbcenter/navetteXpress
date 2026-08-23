// src/app/tarifs/page.tsx
import type { Metadata } from 'next';
import TarifsClient from './TarifsClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Tarifs par Segment — Prix Fixes AIBD, Dakar, Petite Côte | Navette Xpress',
    description:
        'Consultez nos tarifs publics par segment en francs CFA : Dakar, AIBD, Mbour, Saly, Somone. Péage et carburant compris, prix fixe annoncé à la réservation.',
    alternates: { canonical: 'https://navettexpress.com/tarifs' },
    keywords: ['tarifs navette AIBD', 'prix chauffeur privé Dakar', 'tarif transfert aéroport Sénégal', 'prix Petite Côte Saly'],
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Tarifs par segment', item: 'https://navettexpress.com/tarifs' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <TarifsClient />
        </>
    );
}
