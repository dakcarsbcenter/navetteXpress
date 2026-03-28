// src/app/services/page.tsx
import type { Metadata } from 'next';
import ServicesClient from './ServicesClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaBreadcrumb } from '@/lib/schema';
import { serviceTypes } from '@/lib/services';

export const metadata: Metadata = {
    title: 'Services Chauffeur Prive Dakar, Transfert AIBD et Mise a Disposition | Navette Xpress',
    description:
        'Comparez nos services a forte intention: transfert aeroport AIBD, chauffeur prive Dakar, mise a disposition, navette evenementielle et transport hotel.',
    alternates: { canonical: 'https://navettexpress.com/services' },
    keywords: ['transfert aeroport Dakar', 'chauffeur prive Senegal', 'VTC Dakar', 'navette AIBD', 'location voiture avec chauffeur Dakar'],
};

export default function Page() {
    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Services', item: 'https://navettexpress.com/services' },
    ];

    // Map serviceTypes to schema format
    const schemaServices = serviceTypes.filter(s => s.id !== 'autres').map(s => ({
        name: s.name,
        description: s.description,
        url: `https://navettexpress.com/services#${s.id}`,
    }));

    return (
        <>
            <JsonLd data={schemaService(schemaServices[0])} /> {/* Main service focus */}
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <section className="max-w-6xl mx-auto px-6 pt-28 pb-8 space-y-4">
                <h2 className="text-3xl font-display">Pages services prioritaires</h2>
                <p className="text-text-secondary max-w-3xl">
                    Explorez nos pages a forte intention et poursuivez vers les routes les plus demandees.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                    <a href="/services/transfert-aeroport-aibd" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Transfert aeroport AIBD</a>
                    <a href="/services/chauffeur-prive-dakar" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Chauffeur prive Dakar</a>
                    <a href="/services/mise-a-disposition-chauffeur" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Mise a disposition</a>
                    <a href="/routes" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">Hub routes</a>
                    <a href="/faq" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">FAQ</a>
                </div>
            </section>
            <ServicesClient />
        </>
    );
}
