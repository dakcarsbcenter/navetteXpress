import { getTranslations } from "next-intl/server";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ButtonLink } from "@/components/ui/ButtonLink";

// Une 404 garde le visiteur dans le parcours de réservation au lieu d'une
// impasse : liens vers la réservation et les tarifs. Next y ajoute lui-même
// <meta name="robots" content="noindex">.
export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="max-w-3xl mx-auto px-6 pt-36 pb-24 space-y-6 text-center">
        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.16em] uppercase text-accent">404</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-body text-lg">{t("text")}</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <ButtonLink href="/reservation" variant="primary">{t("book")}</ButtonLink>
          <ButtonLink href="/tarifs" variant="secondary">{t("rates")}</ButtonLink>
          <ButtonLink href="/" variant="ghost">{t("home")}</ButtonLink>
        </div>
      </main>
      <Footer />
    </div>
  );
}
