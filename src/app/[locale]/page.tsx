// src/app/[locale]/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeClient from './HomeClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaFAQ } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/', locale),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: buildAlternates('/', locale).canonical,
            images: [{ url: '/og/og-home.jpg', width: 1200, height: 630 }],
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
    const t = await getTranslations({ locale, namespace: 'home' });
    const faqs = t.raw('faqs') as { question: string; answer: string }[];

    return (
        <>
            <JsonLd data={schemaService()} />
            <JsonLd data={schemaFAQ(faqs)} />
            <HomeClient faqs={faqs} />
        </>
    );
}
