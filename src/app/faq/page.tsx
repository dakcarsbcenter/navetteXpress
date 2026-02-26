// src/app/faq/page.tsx
import type { Metadata } from 'next';
import FaqClient from './FaqClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaFAQ, schemaBreadcrumb } from '@/lib/schema';

const faqs = [
    {
        question: "Comment réserver un transfert ?",
        answer: "C'est très simple ! Rendez-vous sur notre page de réservation, remplissez le formulaire avec vos détails de vol et vos informations personnelles. Vous recevrez une confirmation par email avec les détails de votre chauffeur."
    },
    {
        question: "Quels sont vos tarifs ?",
        answer: "Nos tarifs varient selon la destination. Pour Dakar - AIBD ou AIBD - Dakar nos tarifs commencent à 25 000 Fcfa. Pour toute autre destination, contactez-nous pour un devis personnalisé."
    },
    {
        question: "Quels types de véhicules proposez-vous ?",
        answer: "Nous proposons une flotte moderne de véhicules : berlines, SUV et minibus climatisés. Tous nos véhicules sont parfaitement entretenus et équipés pour votre confort."
    },
    {
        question: "Comment me retrouver à l'aéroport ?",
        answer: "Votre chauffeur vous attendra dans le hall d'arrivées avec un panneau à votre nom. Il vous contactera également par téléphone si nécessaire. Nous vous enverrons ses coordonnées avant votre arrivée."
    }
];

export const metadata: Metadata = {
    title: 'FAQ Navette Xpress — Réservation, Tarifs & Chauffeurs Dakar',
    description:
        'Trouvez les réponses à vos questions : comment réserver, prix des transferts AIBD, types de véhicules, suivi de vol et services 24h/24 au Sénégal.',
    alternates: { canonical: 'https://navettexpress.com/faq' },
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'FAQ', item: 'https://navettexpress.com/faq' },
    ];

    return (
        <>
            <JsonLd data={schemaFAQ(faqs)} />
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <FaqClient />
        </>
    );
}
