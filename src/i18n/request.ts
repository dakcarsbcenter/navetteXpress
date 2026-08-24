import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Each namespace is a separate JSON file per locale, merged here into a
// single messages object. Keeps individual files small and reviewable as
// more pages/sections get translated over time.
const namespaces = [
  "common",
  "home",
  "flotte",
  "contact",
  "faq",
  "tarifs",
  "services",
  "routes",
  "zones",
  "entreprises",
  "diaspora",
  "devenir-partenaire",
  "reservation",
  "temoignages",
  "quote-request",
  "auth",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const modules = await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const mod = await import(`../../messages/${locale}/${ns}.json`);
        return [ns, mod.default] as const;
      } catch {
        return [ns, {}] as const;
      }
    })
  );

  // "common" holds shared UI namespaces (Navigation, Footer, ...) and is
  // spread at the top level; every other file is nested under its own name.
  const messages: Record<string, unknown> = {};
  for (const [ns, content] of modules) {
    if (ns === "common") {
      Object.assign(messages, content as Record<string, unknown>);
    } else {
      messages[ns] = content;
    }
  }

  return {
    locale,
    messages,
  };
});
