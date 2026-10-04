// src/app/[locale]/devenir-partenaire/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DevenirPartenaireClient from './DevenirPartenaireClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { schemaBreadcrumb, schemaFAQ, schemaJobPosting } from '@/lib/schema';

interface DriverFaq {
    question: string;
    answer: string;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'devenir-partenaire.meta' });

    const alternates = buildAlternates('/devenir-partenaire', locale);

    return {
        title: t('title'),
        description: t('description'),
        alternates,
        // La page heritait sinon de l'Open Graph global (layout racine), oriente
        // reservation client : le lien de campagne se presentait comme une offre de
        // trajet et non comme un recrutement. L'image vient du fichier
        // opengraph-image.tsx voisin, injecte automatiquement par Next : ne pas
        // redeclarer `images` ici, cela l'ecraserait.
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: alternates.canonical,
            type: 'website',
        },
        // Le layout racine declare un bloc `twitter` explicite (titre client +
        // og-default.jpg) que Next ne derive pas de l'openGraph ci-dessus : sans
        // cette surcharge, un partage sur X afficherait encore la carte de
        // reservation. `images` est volontairement omis pour laisser
        // opengraph-image.tsx alimenter twitter:image.
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
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

    const t = await getTranslations({ locale, namespace: 'devenir-partenaire' });
    const tb = await getTranslations({ locale, namespace: 'routes.breadcrumbs' });
    const canonical = buildAlternates('/devenir-partenaire', locale).canonical;

    // Les FAQ sont rendues dans le client ; on les lit ici aussi pour alimenter
    // le JSON-LD, Google exigeant que la reponse balisee soit visible sur la page.
    const faqs = t.raw('faq.items') as DriverFaq[];

    const breadcrumbs = [
        { name: tb('home'), item: 'https://navettexpress.com' },
        { name: t('hero.eyebrow'), item: canonical },
    ];

    return (
        <>
            <JsonLd
                data={schemaJobPosting({
                    title: t('jobPosting.title'),
                    // `raw` et pas `t` : la description est du HTML, que
                    // next-intl interpreterait sinon comme des balises de rich
                    // text ICU et remplacerait par un message d'erreur.
                    description: t.raw('jobPosting.description'),
                    url: canonical,
                    locale,
                })}
            />
            <JsonLd data={schemaFAQ(faqs)} />
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
            <DevenirPartenaireClient />
        </>
    );
}
