import { NextIntlClientProvider } from "next-intl";
import { Navigation } from "@/components/navigation";
import commonFr from "../../messages/fr/common.json";

// Admin pages live outside the [locale] segment (not translated yet), but
// still reuse the shared Navigation component, which now depends on the
// next-intl context. This provides a static French-only context for it.
export function AdminNavigation({ variant }: { variant?: "transparent" | "solid" }) {
  return (
    <NextIntlClientProvider locale="fr" messages={commonFr}>
      <Navigation variant={variant} />
    </NextIntlClientProvider>
  );
}
