// src/app/entreprises/page.tsx
import type { Metadata } from 'next';
import EntreprisesClient from './EntreprisesClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Hôtels & Entreprises — Compte Corporate, Facturation Mensuelle | Navette Xpress',
    description:
        'Un compte, un interlocuteur, une facture par mois. Solution de transport pour hôtels, entreprises, ONG et missions diplomatiques à Dakar et AIBD.',
    alternates: { canonical: 'https://navettexpress.com/entreprises' },
    keywords: ['transport entreprise Dakar', 'compte corporate navette AIBD', 'chauffeur privé hôtel Sénégal', 'convention transport ONG'],
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Hôtels & entreprises', item: 'https://navettexpress.com/entreprises' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <EntreprisesClient />
        </>
    );
}
