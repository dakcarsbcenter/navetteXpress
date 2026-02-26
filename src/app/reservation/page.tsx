// src/app/reservation/page.tsx
import type { Metadata } from 'next';
import ReservationClient from './ReservationClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Réserver Votre Chauffeur Privé à Dakar | Navette Xpress',
    description:
        'Réservez en ligne votre transfert aéroport AIBD, navette urbaine ou chauffeur privé au Sénégal. Confirmation rapide, prix transparent et service premium garanti.',
    alternates: { canonical: 'https://navettexpress.com/reservation' },
    robots: {
        index: true,
        follow: true,
    },
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Réservation', item: 'https://navettexpress.com/reservation' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <ReservationClient />
        </>
    );
}
