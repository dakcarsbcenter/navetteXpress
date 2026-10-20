// src/app/[locale]/faq/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FaqClient from './FaqClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaFAQ, schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'faq.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/faq', locale),
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'faq' });
    const schemaFaqs = t.raw('schemaFaqs') as { question: string; answer: string }[];
    const categories = t.raw('categories') as {
        title: string;
        questions: { question: string; answer: string }[];
    }[];

    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'FAQ', item: 'https://navettexpress.com/faq' },
    ];

    return (
        <>
            <JsonLd data={schemaFAQ(schemaFaqs)} />
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <FaqClient categories={categories} />
        </>
    );
}
