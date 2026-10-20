// src/app/[locale]/tarifs/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import TarifsClient, { type Segment } from './TarifsClient';
import { getActivePricingSegmentsSafe } from '@/lib/pricing-segments';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { moneyRoutePathForNodes } from '@/lib/seo/internal-links';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'tarifs.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/tarifs', locale),
        keywords: t.raw('keywords') as string[],
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Même lecture (mise en cache, invalidée par l'admin) que la page d'accueil.
    const rows = await getActivePricingSegmentsSafe();
    const segments: Segment[] | undefined =
        rows.length > 0
            ? rows.map((row) => ({
                  id: row.id,
                  route: row.route,
                  distance: row.distance,
                  duree: row.duree,
                  berline: row.berline,
                  suv: row.suv,
                  dot: row.dot as Segment['dot'],
                  zones: (row.zones ?? []) as Segment['zones'],
                  href: moneyRoutePathForNodes(row.departNode, row.arriveeNode) ?? undefined,
              }))
            : undefined;

    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Tarifs par segment', item: 'https://navettexpress.com/tarifs' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <TarifsClient initialSegments={segments} />
        </>
    );
}
