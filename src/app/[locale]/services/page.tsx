// src/app/[locale]/services/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ServicesClient from './ServicesClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaBreadcrumb } from '@/lib/schema';
import { serviceTypes, type ServiceLocale } from '@/lib/services';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'services.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/services', locale),
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
    const t = await getTranslations({ locale, namespace: 'services' });
    const loc = locale as ServiceLocale;

    const breadcrumbs = [
        { name: t('breadcrumbs.home'), item: 'https://navettexpress.com' },
        { name: t('breadcrumbs.services'), item: buildAlternates('/services', locale).canonical },
    ];

    // Map serviceTypes to schema format
    const schemaServices = serviceTypes.filter(s => s.id !== 'autres').map(s => ({
        name: s.translations[loc]?.name ?? s.translations.fr.name,
        description: s.translations[loc]?.description ?? s.translations.fr.description,
        url: `https://navettexpress.com/services#${s.id}`,
    }));

    // Le bloc de maillage interne est rendu par ServicesClient, dans le flux de
    // la page : ici il se serait place avant la <Navigation> et son <h2> aurait
    // precede le <h1>.
    return (
        <>
            <JsonLd data={schemaService(schemaServices[0])} /> {/* Main service focus */}
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <ServicesClient />
        </>
    );
}
