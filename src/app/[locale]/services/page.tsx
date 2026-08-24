// src/app/[locale]/services/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ServicesClient from './ServicesClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaBreadcrumb } from '@/lib/schema';
import { serviceTypes, type ServiceLocale } from '@/lib/services';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { Link } from '@/i18n/navigation';

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

    const priorityLinks = [
        { href: '/services/transfert-aeroport-aibd', label: t('priorityPages.airportTransfer') },
        { href: '/services/chauffeur-prive-dakar', label: t('priorityPages.privateDriver') },
        { href: '/services/mise-a-disposition-chauffeur', label: t('priorityPages.chauffeurDisposal') },
        { href: '/routes', label: t('priorityPages.routesHub') },
        { href: '/faq', label: t('priorityPages.faq') },
    ];

    return (
        <>
            <JsonLd data={schemaService(schemaServices[0])} /> {/* Main service focus */}
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <section className="max-w-6xl mx-auto px-6 pt-28 pb-8 space-y-4">
                <h2 className="text-3xl font-display">{t('priorityHeading')}</h2>
                <p className="text-text-secondary max-w-3xl">
                    {t('priorityIntro')}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                    {priorityLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </section>
            <ServicesClient />
        </>
    );
}
