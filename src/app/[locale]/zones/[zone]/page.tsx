import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ZoneClient from './ZoneClient';
import { routing } from '@/i18n/routing';
import { buildAlternates } from '@/lib/seo/localized-metadata';

const zoneSlugs = ['almadies', 'plateau', 'ngor', 'yoff', 'sacre-coeur'];

interface ZoneData {
    id: string;
    name: string;
    description: string;
    content: string;
}

interface Params {
    params: Promise<{ locale: string; zone: string }>;
}

export function generateStaticParams() {
    return routing.locales.flatMap((locale) =>
        zoneSlugs.map((zone) => ({ locale, zone }))
    );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale, zone: zoneSlug } = await params;
    if (!zoneSlugs.includes(zoneSlug)) return {};

    const t = await getTranslations({ locale, namespace: 'zones' });
    const zone = t.raw(`zonesData.${zoneSlug}`) as ZoneData;
    const alternates = buildAlternates(`/zones/${zoneSlug}`, locale);

    return {
        title: t('meta.titleTemplate', { name: zone.name }),
        description: zone.description,
        alternates,
        openGraph: {
            title: t('meta.ogTitleTemplate', { name: zone.name }),
            description: zone.description,
            url: alternates.canonical,
            images: [{ url: '/og/og-zones.jpg' }],
        },
    };
}

export default async function Page({ params }: Params) {
    const { locale, zone: zoneSlug } = await params;
    if (!zoneSlugs.includes(zoneSlug)) notFound();
    setRequestLocale(locale);

    const t = await getTranslations({ locale, namespace: 'zones' });
    const zone = t.raw(`zonesData.${zoneSlug}`) as ZoneData;

    const breadcrumbs = [
        { name: t('breadcrumbs.home'), item: 'https://navettexpress.com' },
        { name: t('breadcrumbs.zones'), item: buildAlternates('/zones', locale).canonical },
        { name: zone.name, item: buildAlternates(`/zones/${zone.id}`, locale).canonical },
    ];

    return <ZoneClient zone={zone} breadcrumbs={breadcrumbs} />;
}
