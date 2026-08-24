import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { schemaBreadcrumb, schemaFAQ, schemaLocalBusiness, schemaService } from '@/lib/schema';
import {
  getMoneyRouteBySlug,
  getMoneyServiceBySlug,
  moneyServicePages,
  slugToLabel,
  toAbsoluteUrl,
} from '@/lib/seo-money-pages';

interface Params {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    moneyServicePages.map((page) => ({ locale, slug: page.slug }))
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getMoneyServiceBySlug(slug);
  if (!page) {
    return {};
  }

  const localeKey = locale as Locale;
  const translation = page.translations[localeKey] ?? page.translations.fr;
  const alternates = buildAlternates(page.canonicalPath, locale);
  return {
    title: translation.title,
    description: translation.description,
    alternates,
    openGraph: {
      title: translation.title,
      description: translation.description,
      url: alternates.canonical,
      images: [{ url: '/og/og-services.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function ServiceMoneyPage({ params }: Params) {
  const { locale, slug: pageSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'services.slugPage' });

  const page = getMoneyServiceBySlug(pageSlug);
  if (!page) {
    notFound();
  }

  const localeKey = locale as Locale;
  const translation = page.translations[localeKey] ?? page.translations.fr;
  const canonical = toAbsoluteUrl(page.canonicalPath);
  const relatedRoutes = page.relatedRouteSlugs
    .map((slug) => getMoneyRouteBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const relatedServices = page.relatedServiceSlugs
    .map((slug) => getMoneyServiceBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const breadcrumbs = [
    { name: t('breadcrumbHome'), item: 'https://navettexpress.com' },
    { name: t('breadcrumbServices'), item: 'https://navettexpress.com/services' },
    { name: slugToLabel(page.slug), item: canonical },
  ];

  return (
    <>
      <JsonLd data={schemaLocalBusiness} />
      <JsonLd data={schemaService({ name: translation.h1, description: translation.description, url: canonical })} />
      <JsonLd data={schemaFAQ(translation.faqs)} />
      <JsonLd data={schemaBreadcrumb(breadcrumbs)} />

      <div className="min-h-screen bg-background text-foreground">
        <Navigation variant="solid" />

        <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-12">
          <header className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-gold">{t('eyebrow')}</p>
            <h1 className="text-4xl md:text-5xl font-display leading-tight">{translation.h1}</h1>
            <p className="text-lg text-text-secondary">{translation.description}</p>
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-text-muted">
              <span className="px-3 py-1 rounded-full border border-border">{translation.priceFrom}</span>
              <span className="px-3 py-1 rounded-full border border-border">{t('travelTimeLabel')}: {translation.travelTime}</span>
              <span className="px-3 py-1 rounded-full border border-border">{t('availability247')}</span>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-2/40 p-6">
              <h2 className="text-2xl font-display mb-4">{t('whyHeading')}</h2>
              <ul className="space-y-3 text-text-secondary">
                {translation.valuePoints.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2/40 p-6">
              <h2 className="text-2xl font-display mb-4">{t('processHeading')}</h2>
              <ol className="space-y-3 text-text-secondary list-decimal list-inside">
                {translation.aibdProcess.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-6 space-y-4">
            <h2 className="text-2xl font-display">{t('faqHeading')}</h2>
            {translation.faqs.map((faq) => (
              <article key={faq.question} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-text-secondary">{faq.answer}</p>
              </article>
            ))}
            <Link href="/faq" className="inline-block text-gold font-medium hover:underline">
              {t('faqViewAll')}
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-6 space-y-4">
            <h2 className="text-2xl font-display">{t('usefulLinksHeading')}</h2>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wider text-text-muted">{t('recommendedRoutes')}</p>
              <div className="flex flex-wrap gap-3">
                {relatedRoutes.map((route) => (
                  <Link
                    key={route.slug}
                    href={route.canonicalPath}
                    className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors"
                  >
                    {slugToLabel(route.slug)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wider text-text-muted">{t('otherServices')}</p>
              <div className="flex flex-wrap gap-3">
                {relatedServices.map((service) => (
                  <Link
                    key={service.slug}
                    href={service.canonicalPath}
                    className="px-3 py-2 rounded-lg border border-border hover:border-gold hover:text-gold transition-colors"
                  >
                    {slugToLabel(service.slug)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link href="/routes" className="text-gold hover:underline">
                {t('routesHub')}
              </Link>
              <Link href="/reservation" className="text-gold hover:underline">
                {t('bookNow')}
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
