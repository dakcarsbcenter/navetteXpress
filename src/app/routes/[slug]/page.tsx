import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb, schemaFAQ, schemaLocalBusiness, schemaService } from '@/lib/schema';
import {
  getMoneyRouteBySlug,
  getMoneyServiceBySlug,
  moneyRoutePages,
  slugToLabel,
  toAbsoluteUrl,
} from '@/lib/seo-money-pages';

interface Params {
  params: {
    slug: string;
  };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return moneyRoutePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = getMoneyRouteBySlug(params.slug);
  if (!page) {
    return {};
  }

  const canonical = toAbsoluteUrl(page.canonicalPath);
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      images: [{ url: '/og/og-routes.jpg', width: 1200, height: 630 }],
    },
  };
}

export default function RouteMoneyPage({ params }: Params) {
  const page = getMoneyRouteBySlug(params.slug);
  if (!page) {
    notFound();
  }

  const canonical = toAbsoluteUrl(page.canonicalPath);
  const relatedRoutes = page.relatedRouteSlugs
    .map((slug) => getMoneyRouteBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const relatedServices = page.relatedServiceSlugs
    .map((slug) => getMoneyServiceBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const breadcrumbs = [
    { name: 'Accueil', item: 'https://navettexpress.com' },
    { name: 'Routes', item: 'https://navettexpress.com/routes' },
    { name: slugToLabel(page.slug), item: canonical },
  ];

  return (
    <>
      <JsonLd data={schemaLocalBusiness} />
      <JsonLd data={schemaService({ name: page.h1, description: page.description, url: canonical })} />
      <JsonLd data={schemaFAQ(page.faqs)} />
      <JsonLd data={schemaBreadcrumb(breadcrumbs)} />

      <div className="min-h-screen bg-background text-foreground">
        <Navigation variant="solid" />

        <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-12">
          <header className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-gold">Route prioritaire</p>
            <h1 className="text-4xl md:text-5xl font-display leading-tight">{page.h1}</h1>
            <p className="text-lg text-text-secondary">{page.description}</p>
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-text-muted">
              <span className="px-3 py-1 rounded-full border border-border">{page.priceFrom}</span>
              <span className="px-3 py-1 rounded-full border border-border">Temps moyen: {page.travelTime}</span>
              <span className="px-3 py-1 rounded-full border border-border">Ponctualite 24/7</span>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-2/40 p-6">
              <h2 className="text-2xl font-display mb-4">Preuves de fiabilite</h2>
              <ul className="space-y-3 text-text-secondary">
                {page.valuePoints.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2/40 p-6">
              <h2 className="text-2xl font-display mb-4">Process accueil AIBD</h2>
              <ol className="space-y-3 text-text-secondary list-decimal list-inside">
                {page.aibdProcess.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-6 space-y-4">
            <h2 className="text-2xl font-display">FAQ Route</h2>
            {page.faqs.map((faq) => (
              <article key={faq.question} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-text-secondary">{faq.answer}</p>
              </article>
            ))}
            <Link href="/faq" className="inline-block text-gold font-medium hover:underline">
              Voir la FAQ complete
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-6 space-y-4">
            <h2 className="text-2xl font-display">Maillage interne</h2>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wider text-text-muted">Autres routes strategiques</p>
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
              <p className="text-sm uppercase tracking-wider text-text-muted">Services associes</p>
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
                Retour au hub routes
              </Link>
              <Link href="/reservation" className="text-gold hover:underline">
                Reserver ce trajet
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}