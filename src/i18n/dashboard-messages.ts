import type { Locale } from "./routing";

// Separate from src/i18n/request.ts on purpose: that loader is driven by
// next-intl's routing/[locale] segment (setRequestLocale), which dashboard
// routes never go through. This one just takes an already-resolved locale.
export type DashboardNamespace = "common" | "driver" | "client" | "entreprise" | "admin" | "statuses";

export async function getDashboardMessages(
  locale: Locale,
  namespaces: DashboardNamespace[]
): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      try {
        // "statuses" is shared across every dashboard role, so unlike the
        // other namespaces it isn't prefixed with "dashboard-".
        const mod = ns === "statuses"
          ? await import(`../../messages/${locale}/statuses.json`)
          : await import(`../../messages/${locale}/dashboard-${ns}.json`);
        return [ns, mod.default] as const;
      } catch {
        return [ns, {}] as const;
      }
    })
  );

  return Object.fromEntries(entries);
}
