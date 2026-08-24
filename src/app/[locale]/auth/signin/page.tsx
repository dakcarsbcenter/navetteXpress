// src/app/[locale]/auth/signin/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import SignInClient from './SignInClient';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'auth.signin.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/auth/signin', locale),
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
    return <SignInClient />;
}
