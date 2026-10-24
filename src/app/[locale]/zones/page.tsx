import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { MobileContactBar } from '@/components/seo/MobileContactBar';
import { TrustStrip } from '@/components/seo/TrustStrip';
import { Link } from '@/i18n/navigation';
import { schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { zoneSlugs } from '@/lib/seo/zone-slugs';
import { getMoneyRouteBySlug } from '@/lib/seo-money-pages';
import { moneyPageLabel } from '@/lib/seo/internal-links';

// Hub des pages quartiers. Le fil d'Ariane de /zones/[zone] pointait vers cette
// URL alors qu'elle n'existait pas (404 dans le JSON-LD BreadcrumbList).

interface ZoneData {
  id: string;
  name: string;
  description: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'zones.hub.meta' });
  const alternates = buildAlternates('/zones', locale);
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: { title: t('title'), description: t('description'), url: alternates.canonical },
  };
}

// Trajets réservés le plus souvent depuis un quartier de Dakar
const DAKAR_ROUTE_SLUGS = ['dakar-aibd', 'aibd-dakar', 'aibd-saly'];

export default async function ZonesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'zones' });
  const alternates = buildAlternates('/zones', locale);

  const zones = zoneSlugs.map((slug) => t.raw(`zonesData.${slug}`) as ZoneData);
  const routes = DAKAR_ROUTE_SLUGS
    .map((slug) => getMoneyRouteBySlug(slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));

  const breadcrumbs = [
    { name: t('breadcrumbs.home'), item: 'https://navettexpress.com' },
    { name: t('breadcrumbs.zones'), item: alternates.canonical },
  ];

  return (
    <>
      <JsonLd data={schemaBreadcrumb(breadcrumbs)} />
      <div className="min-h-screen bg-background text-foreground">
        <Navigation variant="solid" />

        <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-12">
          <header className="space-y-4">
            <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted">
              <Link href="/" className="hover:text-accent transition-colors">{t('breadcrumbs.home')}</Link>
              <span className="text-text-muted/40">/</span>
              <span className="text-foreground">{t('breadcrumbs.zones')}</span>
            </nav>
            <p className="text-sm uppercase tracking-widest text-gold-deep">{t('hub.eyebrow')}</p>
            <h1 className="text-4xl md:text-5xl font-display leading-tight">{t('hub.h1')}</h1>
            <p className="text-lg text-text-secondary max-w-3xl">{t('hub.intro')}</p>
            <TrustStrip locale={locale} className="pt-2" />
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {zones.map((zone) => (
              <Link
                key={zone.id}
                href={`/zones/${zone.id}`}
                className="group rounded-2xl border border-border bg-surface-2/40 p-6 flex flex-col gap-2 hover:border-gold transition-colors"
              >
                <h2 className="text-xl font-display group-hover:text-gold transition-colors">{zone.name}</h2>
                <p className="text-sm text-text-secondary">{zone.description}</p>
                <span className="text-sm font-medium text-gold-deep mt-auto pt-2">{t('hub.seeZone')} &rarr;</span>
              </Link>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-6 space-y-4">
            <h2 className="text-2xl font-display">{t('hub.routesHeading')}</h2>
            <div className="flex flex-wrap gap-3">
              {routes.map((route) => (
                <Link
                  key={route.slug}
                  href={route.canonicalPath}
                  className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors"
                >
                  {moneyPageLabel(route, locale)}
                </Link>
              ))}
            </div>
            <Link href="/tarifs" className="inline-block text-gold-deep hover:underline">{t('hub.ratesLink')}</Link>
          </section>
        </main>

        <Footer />
        <MobileContactBar locale={locale} bookingHref="/reservation?service=chauffeur-prive-dakar&pickup=DAKAR" />
      </div>
    </>
  );
}
