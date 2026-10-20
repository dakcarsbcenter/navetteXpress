import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CookieBanner } from "@/components/CookieBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { schemaLocalBusiness, schemaWebSite } from "@/lib/schema";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Pages publiques seulement : les espaces connectes (admin, chauffeur,
          client) vivent hors de [locale] et n'ont pas a porter ces donnees. */}
      <JsonLd data={schemaLocalBusiness} />
      <JsonLd data={schemaWebSite} />
      {children}
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
