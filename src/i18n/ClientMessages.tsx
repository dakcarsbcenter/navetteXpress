import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Namespaces lus par les composants clients présents sur toutes les pages
 * publiques (en-tête, pied de page, bandeau cookies).
 */
export const SHARED_CLIENT_NAMESPACES = ["Navigation", "Footer", "CookieBanner"];

/**
 * Fournit aux composants clients uniquement les traductions dont la page a
 * besoin. Tout ce que reçoit NextIntlClientProvider est sérialisé dans le HTML :
 * passer tous les messages envoyait ~90 Ko de textes (CGV, FAQ, formulaire de
 * réservation...) sur chaque page, money pages comprises.
 *
 * Un fournisseur imbriqué REMPLACE les messages du parent (il ne les fusionne
 * pas) : les namespaces partagés sont donc toujours inclus. Les composants
 * serveur (getTranslations) n'en dépendent pas.
 */
export async function ClientMessages({
  namespaces = [],
  children,
}: {
  namespaces?: string[];
  children: React.ReactNode;
}) {
  const all = (await getMessages()) as Record<string, unknown>;
  const messages: Record<string, unknown> = {};
  for (const ns of [...SHARED_CLIENT_NAMESPACES, ...namespaces]) {
    if (ns in all) messages[ns] = all[ns];
  }
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
