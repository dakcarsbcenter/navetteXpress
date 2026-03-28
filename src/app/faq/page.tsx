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
    title: 'FAQ Transfert AIBD, Tarifs et Reservation Chauffeur Prive Dakar | Navette Xpress',
    description:
        'Questions frequentes sur les transferts AIBD, prix fixes, process d accueil aeroport, reservation en ligne et service chauffeur prive 24/7.',
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
            <section className="max-w-6xl mx-auto px-6 pt-28 pb-8 space-y-4">
                <h2 className="text-3xl font-display">Avant de reserver</h2>
                <div className="flex flex-wrap gap-3 text-sm">
                    <a href="/routes" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Hub routes</a>
                    <a href="/services" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Hub services</a>
                    <a href="/reservation" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Reservation</a>
                </div>
            </section>
            <FaqClient />
        </>
    );
}
