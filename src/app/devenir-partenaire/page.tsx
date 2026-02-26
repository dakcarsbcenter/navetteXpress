// src/app/devenir-partenaire/page.tsx
import type { Metadata } from 'next';
import DevenirPartenaireClient from './DevenirPartenaireClient';

export const metadata: Metadata = {
    title: 'Devenir Partenaire Chauffeur à Dakar | Navette Xpress',
    description:
        'Rejoignez le réseau Navette Xpress. Devenez chauffeur privé partenaire à Dakar et bénéficiez de revenus attractifs, d\'horaires flexibles et d\'un support 24h/24.',
    alternates: { canonical: 'https://navettexpress.com/devenir-partenaire' },
};

export default function Page() {
    return <DevenirPartenaireClient />;
}
