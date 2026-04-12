import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';

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

  return <JsonLd data={schemaBreadcrumb(breadcrumbs)} />;
}