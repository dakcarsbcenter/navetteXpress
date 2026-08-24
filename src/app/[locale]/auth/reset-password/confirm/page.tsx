// src/app/[locale]/auth/reset-password/confirm/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ResetPasswordConfirmClient from './ResetPasswordConfirmClient';
import { buildAlternates } from '@/lib/seo/localized-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'auth.resetPasswordConfirm.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/auth/reset-password/confirm', locale),
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
    return <ResetPasswordConfirmClient />;
}
