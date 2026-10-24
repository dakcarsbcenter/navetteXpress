import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/lib/dashboard-locale";
import { RootShell } from "./RootShell";

/**
 * Document HTML des espaces connectés : langue lue dans le cookie du tableau de
 * bord (rendu à la demande, ce que ces pages sont de toute façon).
 */
export async function DashboardRootShell({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "Navigation" });
  return (
    <RootShell locale={locale} skipLabel={t("skipToContent")}>
      {children}
    </RootShell>
  );
}
