import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaBreadcrumb } from '@/lib/schema';
import { buildAlternates } from '@/lib/seo/localized-metadata';

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
  const t = await getTranslations({ locale, namespace: 'routes.breadcrumbs' });
  const alternates = buildAlternates('/routes', locale);

  const breadcrumbs = [
    { name: t('home'), item: 'https://navettexpress.com' },
    { name: t('routes'), item: alternates.canonical },
  ];

  return <JsonLd data={schemaBreadcrumb(breadcrumbs)} />;
}
