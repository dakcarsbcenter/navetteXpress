// src/app/reservation/page.tsx
import type { Metadata } from 'next';
import ReservationClient from './ReservationClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Reservation Chauffeur Prive Dakar et Transfert AIBD Prix Fixe | Navette Xpress',
    description:
        'Reservez en ligne votre transfert aeroport AIBD ou chauffeur prive a Dakar. Confirmation rapide, prix fixe, service disponible 24/7.',
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
