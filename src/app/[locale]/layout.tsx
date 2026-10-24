import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClientMessages } from "@/i18n/ClientMessages";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CookieBanner } from "@/components/CookieBanner";
import { ContactTracking } from "@/components/analytics/ContactTracking";
import { RootShell } from "@/components/layout/RootShell";
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
  const t = await getTranslations({ locale, namespace: "Navigation" });

  // Langue issue du segment d'URL : la page reste statique (voir RootShell).
  return (
    <RootShell locale={locale} skipLabel={t("skipToContent")}>
    {/* Traductions partagées seulement ; chaque page ajoute les siennes (ClientMessages) */}
    <ClientMessages>
      {/* Pages publiques seulement : les espaces connectes (admin, chauffeur,
          client) vivent hors de [locale] et n'ont pas a porter ces donnees. */}
      <JsonLd data={schemaLocalBusiness} />
      <JsonLd data={schemaWebSite} />
      {children}
      <CookieBanner />
      <ContactTracking />
    </ClientMessages>
    </RootShell>
  );
}
