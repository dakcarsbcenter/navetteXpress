// src/app/[locale]/mentions-legales/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legal.mentions.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/mentions-legales', locale),
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <LegalPage locale={locale} doc="mentions" />;
}
