// src/app/[locale]/devenir-partenaire/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DevenirPartenaireClient from './DevenirPartenaireClient';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'devenir-partenaire.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/devenir-partenaire', locale),
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <DevenirPartenaireClient />;
}
