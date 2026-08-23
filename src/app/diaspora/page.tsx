// src/app/diaspora/page.tsx
import type { Metadata } from 'next';
import DiasporaClient from './DiasporaClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Diaspora — Organisez l\'Arrivée depuis l\'Étranger | Navette Xpress',
    description:
        'Réservez depuis Paris, Milan ou New York pour vous ou votre famille qui rentre au Sénégal. Confirmation WhatsApp en français ou anglais, paiement depuis l\'étranger.',
    alternates: { canonical: 'https://navettexpress.com/diaspora' },
    keywords: ['transport diaspora sénégalaise', 'réserver navette AIBD depuis étranger', 'accueil aéroport famille Sénégal', 'chauffeur Dakar diaspora'],
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Diaspora', item: 'https://navettexpress.com/diaspora' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <DiasporaClient />
        </>
    );
}
