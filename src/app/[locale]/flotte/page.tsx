// src/app/[locale]/flotte/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FleetClient from './FleetClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'flotte.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/flotte', locale),
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
    const t = await getTranslations({ locale, namespace: 'flotte' });

    const breadcrumbs = [
        { name: t('breadcrumbs.home'), item: 'https://navettexpress.com' },
        { name: t('breadcrumbs.fleet'), item: 'https://navettexpress.com/flotte' },
    ];

    return (
        <>
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <FleetClient />
        </>
    );
}
