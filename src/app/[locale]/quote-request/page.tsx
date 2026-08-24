import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { QuoteRequestForm } from '@/components/client/QuoteRequestForm'
import { buildAlternates } from '@/lib/seo/localized-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'quote-request.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates('/quote-request', locale),
  };
}

export default async function QuoteRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />
      <div className="pt-28 pb-16">
        <QuoteRequestForm />
      </div>
      <Footer />
    </div>
  )
}
