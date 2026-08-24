// src/app/[locale]/auth/signup/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import SignUpClient from './SignUpClient';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'auth.signup.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/auth/signup', locale),
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
    return <SignUpClient />;
}
