import { getTranslations } from "next-intl/server";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { TrustStrip } from "@/components/seo/TrustStrip";
import { whatsappHref } from "@/lib/contact";
import type { MoneyPagePriceRow } from "@/lib/seo/money-page-booking";

const formatFcfa = (value: number, locale: string) =>
  value.toLocaleString(locale === "en" ? "en-US" : "fr-FR");

/** « À partir de 25 000 FCFA » depuis la grille, ou « Prix sur devis ». */
export async function moneyPagePriceLabel(rows: MoneyPagePriceRow[], locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: "MoneyPage" });
  return rows.length > 0 ? t("from", { price: formatFcfa(rows[0].berline, locale) }) : t("onQuote");
}

/**
 * Bloc de conversion des money pages, placé sous le h1 : tarifs réels de la
 * grille admin, bouton qui ouvre la réservation déjà remplie pour ce trajet,
 * repli WhatsApp avec message pré-rédigé, et garanties.
 */
export async function MoneyPageBooking({
  locale,
  rows,
  bookingHref,
  tripLabel,
}: {
  locale: string;
  rows: MoneyPagePriceRow[];
  bookingHref: string;
  tripLabel: string;
}) {
  const t = await getTranslations({ locale, namespace: "MoneyPage" });

  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-6 space-y-5" aria-labelledby="money-page-prices">
      <h2 id="money-page-prices" className="text-2xl font-display">{t("pricesHeading")}</h2>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">{t("route")}</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">{t("sedan")}</th>
                <th scope="col" className="py-2 font-medium text-right">{t("suv")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-3 pr-4">{row.route}</td>
                  <td className="py-3 pr-4 text-right font-semibold whitespace-nowrap">{formatFcfa(row.berline, locale)} FCFA</td>
                  <td className="py-3 text-right whitespace-nowrap">{formatFcfa(row.suv, locale)} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-3 text-xs text-text-muted">{t("included")}</p>
        </div>
      ) : (
        <p className="text-text-secondary">{t("onQuoteText")}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={bookingHref} variant="primary" size="lg">{t("book")}</ButtonLink>
        <a
          href={whatsappHref(t("whatsappMessage", { trip: tripLabel }))}
          target="_blank"
          rel="noopener noreferrer"
          data-track="money-page"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-border font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <WhatsappLogo size={20} weight="fill" className="text-[#1E8E4E]" aria-hidden />
          {t("whatsapp")}
        </a>
      </div>

      <TrustStrip locale={locale} />
    </section>
  );
}
