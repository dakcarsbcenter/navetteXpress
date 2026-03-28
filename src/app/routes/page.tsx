import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';
import { moneyRoutePages, slugToLabel } from '@/lib/seo-money-pages';

export const metadata: Metadata = {
  title: 'Routes AIBD Dakar Saly Somone Mbour Thies Saint-Louis | Navette Xpress',
  description:
    'Hub des routes prioritaires Navette Xpress: comparez les trajets AIBD et reservez votre chauffeur prive au meilleur rapport fiabilite/prix.',
  alternates: {
    canonical: 'https://navettexpress.com/routes',
  },
  openGraph: {
    title: 'Routes AIBD et Transferts Prives | Navette Xpress',
    description:
      'Consultez nos pages routes a forte intention et reservez un transfert prive 24/7 au Senegal.',
    url: 'https://navettexpress.com/routes',
    images: [{ url: '/og/og-routes.jpg', width: 1200, height: 630 }],
  },
};

export default function RoutesHubPage() {
  const breadcrumbs = [
    { name: 'Accueil', item: 'https://navettexpress.com' },
    { name: 'Routes', item: 'https://navettexpress.com/routes' },
  ];

  return (
    <>
      <JsonLd data={schemaBreadcrumb(breadcrumbs)} />

      <div className="min-h-screen bg-background text-foreground">
        <Navigation variant="solid" />

        <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 space-y-10">
          <header className="space-y-4 max-w-3xl">
            <p className="text-sm uppercase tracking-widest text-gold">Hub SEO Routes</p>
            <h1 className="text-4xl md:text-5xl font-display">Routes Prioritaires Transfert AIBD et Villes Cles</h1>
            <p className="text-lg text-text-secondary">
              Cette page regroupe les pages money les plus intentes. Chaque route detaille tarif indicatif,
              temps de trajet, process d accueil AIBD et FAQ transactionnelle.
            </p>
          </header>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {moneyRoutePages.map((route) => (
              <article key={route.slug} className="rounded-2xl border border-border bg-surface-2/40 p-5 flex flex-col gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-display">{slugToLabel(route.slug)}</h2>
                  <p className="text-text-secondary text-sm">{route.description}</p>
                </div>
                <div className="text-sm text-text-muted space-y-1">
                  <p>{route.priceFrom}</p>
                  <p>Temps moyen: {route.travelTime}</p>
                </div>
                <Link href={route.canonicalPath} className="text-gold font-medium hover:underline mt-auto">
                  Voir la page route
                </Link>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-surface-2/40 p-6 flex flex-wrap gap-4">
            <Link href="/services" className="text-gold hover:underline">
              Hub services
            </Link>
            <Link href="/faq" className="text-gold hover:underline">
              FAQ reservation et tarifs
            </Link>
            <Link href="/reservation" className="text-gold hover:underline">
              Reservation en ligne
            </Link>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}