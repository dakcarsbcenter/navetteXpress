import { getTranslations } from "next-intl/server";
import { CalendarX, Clock, Wallet, UserCircleCheck } from "@phosphor-icons/react/dist/ssr";

/**
 * Garanties confirmées (annulation 24 h, 60 min d'attente, moyens de paiement),
 * au même libellé partout. Les règles vivent dans messages/<loc>/common.json
 * (MoneyPage.trust) : les modifier là, jamais page par page.
 */
export async function TrustStrip({ locale, className = "" }: { locale: string; className?: string }) {
  const t = await getTranslations({ locale, namespace: "MoneyPage.trust" });
  const items = [
    { icon: CalendarX, label: t("cancel") },
    { icon: Clock, label: t("wait") },
    { icon: Wallet, label: t("payment") },
    { icon: UserCircleCheck, label: t("noAccount") },
  ];
  return (
    <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-secondary ${className}`}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon size={18} weight="regular" className="text-accent shrink-0" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
