// src/app/page.tsx
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaFAQ } from '@/lib/schema';

export const metadata: Metadata = {
    title: 'Chauffeur Privé Dakar & Transfert Aéroport AIBD | Navette Xpress',
    description:
        'Navette Xpress, le service de chauffeur privé N°1 à Dakar. Transfert aéroport AIBD 24h/24, navette urbaine, mise à disposition. Réservation en ligne instantanée. Prix fixe garanti.',
    alternates: {
        canonical: 'https://navettexpress.com',
        languages: {
            'fr-FR': 'https://navettexpress.com',
            'en-US': 'https://navettexpress.com/en',
        },
    },
    openGraph: {
        title: 'Chauffeur Privé Dakar & Transfert AIBD — Navette Xpress',
        description: 'Service premium de chauffeur privé à Dakar. Transfert aéroport AIBD, navette urbaine 24h/24.',
        url: 'https://navettexpress.com',
        images: [{ url: '/og/og-home.jpg', width: 1200, height: 630 }],
    },
};

const faqs = [
    {
        question: 'Combien coûte un transfert Dakar-AIBD ?',
        answer: 'Le prix d\'un transfert entre Dakar et l\'aéroport AIBD varie selon le véhicule choisi : à partir de 15 000 FCFA pour une berline confort, 22 000 FCFA pour un SUV Premium et 30 000 FCFA pour un SUV VIP. Le prix est fixe, sans supplément.',
    },
    {
        question: 'Comment réserver un chauffeur privé à Dakar ?',
        answer: 'La réservation se fait en ligne sur notre site en moins de 2 minutes : saisissez votre trajet, choisissez votre véhicule, renseignez vos coordonnées et confirmez. Vous recevez immédiatement une confirmation par email et SMS.',
    },
    {
        question: 'Navette Xpress est-il disponible 24h/24 ?',
        answer: 'Oui, notre service est disponible 24h/24 et 7j/7, y compris les jours fériés. Nos chauffeurs assurent les transferts de nuit et les vols très tôt le matin.',
    },
    {
        question: 'Acceptez-vous les paiements par Orange Money et Wave ?',
        answer: 'Oui, nous acceptons Orange Money, Wave, les espèces à bord et les virements bancaires. Le paiement est simple et sécurisé.',
    },
    {
        question: 'Que se passe-t-il si mon vol est retardé ?',
        answer: 'Votre chauffeur suit votre vol en temps réel. En cas de retard, il ajuste automatiquement son heure d\'arrivée. Vous ne payez aucun frais d\'attente pour les retards de vol.',
    },
    {
        question: 'Navette Xpress dessert-il Saly et Mbour ?',
        answer: 'Oui, nous assurons des transferts depuis et vers Dakar, Saly, Mbour et toute la région de Thiès. Contactez-nous pour un devis personnalisé.',
    },
];

export default function Page() {
    return (
        <>
            <JsonLd data={schemaService()} />
            <JsonLd data={schemaFAQ(faqs)} />
            <HomeClient />
        </>
    );
}
