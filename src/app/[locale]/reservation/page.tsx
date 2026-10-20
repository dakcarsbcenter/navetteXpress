// src/app/[locale]/reservation/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ReservationClient from './ReservationClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'reservation.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/reservation', locale),
        // Formulaire de reservation : aucune valeur de recherche propre (les money
        // pages portent les requetes). noindex pour que Google concentre le
        // crawl sur elles ; follow pour que les liens sortants restent suivis.
        robots: {
            index: false,
            follow: true,
        },
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'reservation' });

    const breadcrumbs = [
        { name: t('breadcrumbs.home'), item: 'https://navettexpress.com' },
        { name: t('breadcrumbs.reservation'), item: 'https://navettexpress.com/reservation' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <ReservationClient />
        </>
    );
}
