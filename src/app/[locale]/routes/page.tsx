import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Link } from '@/i18n/navigation';
import { type Locale } from '@/i18n/routing';
import { schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import {
  moneyRoutePages,
  moneyServicePages,
  toAbsoluteUrl,
  type MoneyPageDefinition,
} from '@/lib/seo-money-pages';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'routes.meta' });
  const alternates = buildAlternates('/routes', locale);

  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
      images: [{ url: '/og/og-routes.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function RoutesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'routes' });
  const alternates = buildAlternates('/routes', locale);
  const localeKey = locale as Locale;

  const breadcrumbs = [
    { name: t('breadcrumbs.home'), item: 'https://navettexpress.com' },
    { name: t('breadcrumbs.routes'), item: alternates.canonical },
  ];

  // ItemList : indique à Google que cette page est le hub des pages routes,
  // pour qu'il les rattache entre elles au lieu de les traiter comme
  // orphelines (elles n'étaient atteignables que par le sitemap).
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('hub.h1'),
    itemListElement: moneyRoutePages.map((page, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: (page.translations[localeKey] ?? page.translations.fr).h1,
      url: toAbsoluteUrl(page.canonicalPath),
    })),
  };

  const cardClass =
    'group rounded-2xl border border-border bg-surface-2/40 p-6 flex flex-col gap-3 hover:border-gold transition-colors';

  function renderCard(page: MoneyPageDefinition, ctaLabel: string) {
    const tr = page.translations[localeKey] ?? page.translations.fr;
    return (
      <Link key={page.slug} href={page.canonicalPath} className={cardClass}>
        {/* On reprend le H1 de la page cible plutôt que le slug : l'ancre
            interne porte ainsi le mot-clé réel de la destination. */}
        <h3 className="text-xl font-display leading-snug group-hover:text-gold transition-colors">
          {tr.h1}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-3">{tr.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-text-muted pt-1">
          <span className="px-2.5 py-1 rounded-full border border-border">{tr.priceFrom}</span>
          <span className="px-2.5 py-1 rounded-full border border-border">
            {t('hub.travelTimeLabel')}: {tr.travelTime}
          </span>
        </div>
        <span className="text-sm font-medium text-gold-deep mt-auto pt-2">{ctaLabel} &rarr;</span>
      </Link>
    );
  }

  return (
    <>
      <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
      <JsonLd data={itemList} />

      <div className="min-h-screen bg-background text-foreground">
        <Navigation variant="solid" />

        <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 space-y-14">
          <header className="space-y-4 max-w-3xl">
            <p className="text-sm uppercase tracking-widest text-gold-deep">{t('hub.eyebrow')}</p>
            <h1 className="text-4xl md:text-5xl font-display leading-tight">{t('hub.h1')}</h1>
            <p className="text-lg text-text-secondary">{t('hub.intro')}</p>
          </header>

          <section className="space-y-6">
            <h2 className="text-2xl font-display">{t('hub.routesHeading')}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {moneyRoutePages.map((page) => renderCard(page, t('hub.seeRoute')))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display">{t('hub.servicesHeading')}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {moneyServicePages.map((page) => renderCard(page, t('hub.seeService')))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-8 space-y-4">
            <h2 className="text-2xl font-display">{t('hub.ctaHeading')}</h2>
            <p className="text-text-secondary max-w-2xl">{t('hub.ctaText')}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/reservation"
                className="px-5 py-2.5 rounded-lg bg-gold text-background font-medium hover:opacity-90 transition-opacity"
              >
                {t('hub.ctaBook')}
              </Link>
              <Link
                href="/quote-request"
                className="px-5 py-2.5 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors"
              >
                {t('hub.ctaQuote')}
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              <Link href="/tarifs" className="text-gold-deep hover:underline">
                {t('hub.tarifsLink')}
              </Link>
              <Link href="/faq" className="text-gold-deep hover:underline">
                {t('hub.faqLink')}
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
