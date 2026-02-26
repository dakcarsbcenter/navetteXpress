// src/app/contact/page.tsx
import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
    title: 'Contactez Navette Xpress — Chauffeur Privé Dakar',
    description:
        'Contactez Navette Xpress pour réserver votre chauffeur privé à Dakar. Disponible par téléphone, WhatsApp et email. +221 78 131 91 91 — Réponse immédiate 24h/24.',
    alternates: { canonical: 'https://navettexpress.com/contact' },
};

export default function Page() {
    return <ContactClient />;
}
