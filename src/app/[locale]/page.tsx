// src/app/[locale]/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeClient from './HomeClient';
import type { HomeSegment } from './SegmentsShowcase';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaService, schemaFAQ } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { getActivePricingSegmentsSafe, cheapestBetweenNodes } from '@/lib/pricing-segments';

// Les tarifs affiches (cartes de segments, FAQ et JSON-LD FAQPage) viennent de la
// table pricing_segments geree en admin. Cette page est rendue a la demande : la
// lecture elle-meme est mise en cache dans getActivePricingSegmentsSafe, et les
// modifications faites en admin invalident ce cache tout de suite.

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates('/', locale),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: buildAlternates('/', locale).canonical,
            images: [{ url: '/og/og-home.jpg', width: 1200, height: 630 }],
        },
    };
}

// Les reponses de FAQ portent les prix sous forme de marqueurs {berlineDakarAibd} /
// {suvDakarAibd} : un seul endroit a mettre a jour quand le tarif change, et aucun
// montant fige dans les fichiers de traduction.
function fillPlaceholders(text: string, values: Record<string, string>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

const CARDS_ON_HOME = 4;

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'home' });

    // Base injoignable : on retombe sur les tarifs de repli des fichiers de
    // traduction plutot que de faire tomber la page d'accueil.
    const pricingSegments = await getActivePricingSegmentsSafe();
    const fallbackSegments = t.raw('segments.fallback') as HomeSegment[];

    const homeSegments: HomeSegment[] =
        pricingSegments.length > 0
            ? pricingSegments.slice(0, CARDS_ON_HOME)
            : fallbackSegments.slice(0, CARDS_ON_HOME);

    // Prix d'appel Dakar <-> AIBD cite dans la FAQ. Le premier segment de repli est
    // ce meme trajet, ce qui garde une reponse coherente si la base est injoignable.
    const dakarAibd = cheapestBetweenNodes(pricingSegments, 'DAKAR', 'AIBD') ?? {
        berline: fallbackSegments[0].berline,
        suv: fallbackSegments[0].suv,
    };
    const formatPrice = (value: number) => new Intl.NumberFormat(locale).format(value);

    const faqs = (t.raw('faqs') as { question: string; answer: string }[]).map((faq) => ({
        question: faq.question,
        answer: fillPlaceholders(faq.answer, {
            berlineDakarAibd: formatPrice(dakarAibd.berline),
            suvDakarAibd: formatPrice(dakarAibd.suv),
        }),
    }));

    return (
        <>
            <JsonLd data={schemaService()} />
            <JsonLd data={schemaFAQ(faqs)} />
            <HomeClient faqs={faqs} segments={homeSegments} />
        </>
    );
}
