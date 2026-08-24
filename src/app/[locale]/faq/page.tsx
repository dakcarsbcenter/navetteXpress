// src/app/[locale]/faq/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FaqClient from './FaqClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaFAQ, schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { Link } from '@/i18n/navigation';

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
            <section className="max-w-6xl mx-auto px-6 pt-28 pb-8 space-y-4">
                <h2 className="text-3xl font-display">{t('beforeBooking.heading')}</h2>
                <div className="flex flex-wrap gap-3 text-sm">
                    <Link href="/routes" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">{t('beforeBooking.routesHub')}</Link>
                    <Link href="/services" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">{t('beforeBooking.servicesHub')}</Link>
                    <Link href="/reservation" className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors">{t('beforeBooking.reservation')}</Link>
                </div>
            </section>
            <FaqClient categories={categories} />
        </>
    );
}
