// src/app/[locale]/auth/verify-email/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import VerifyEmailClient from './VerifyEmailClient';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'auth.verifyEmail.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/auth/verify-email', locale),
        robots: {
            index: false,
            follow: false,
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
    return <VerifyEmailClient />;
}
