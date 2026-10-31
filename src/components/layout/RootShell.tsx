import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { GoogleAnalytics } from "@/app/google-analytics";
import { CapacitorAppUrlListener } from "@/components/mobile/CapacitorAppUrlListener";

// Polices hébergées dans le dépôt (sous-ensemble latin de Google Fonts) :
// next/font/google les téléchargeait à chaque build, et le build Docker du VPS
// échouait quand Google y renvoyait un CSS inattendu.
const archivo = localFont({
  variable: "--font-archivo",
  src: "../../fonts/archivo-latin.woff2",
  weight: "400 700",
  display: "swap",
});

const ibmPlexMono = localFont({
  variable: "--font-ibm-plex-mono",
  src: [
    { path: "../../fonts/ibm-plex-mono-400-latin.woff2", weight: "400" },
    { path: "../../fonts/ibm-plex-mono-500-latin.woff2", weight: "500" },
    { path: "../../fonts/ibm-plex-mono-600-latin.woff2", weight: "600" },
  ],
  display: "swap",
});

/**
 * Document HTML commun (html, body, polices, fournisseurs).
 *
 * Il ne vit plus dans src/app/layout.tsx : celui-ci appelait getLocale(), qui
 * lit les en-têtes de la requête et rendait TOUTES les pages publiques
 * dynamiques (Cache-Control no-store, ni cache Cloudflare ni bf-cache). Chaque
 * layout de premier niveau rend désormais ce shell avec sa langue :
 * - src/app/[locale]/layout.tsx : langue issue de l'URL, pages statiques ;
 * - espaces connectés (admin, client, driver, entreprise...) : langue du cookie
 *   tableau de bord, rendus à la demande comme avant.
 */
export function RootShell({
  locale,
  skipLabel,
  children,
}: {
  locale: string;
  skipLabel: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={locale} suppressHydrationWarning className={`scroll-smooth ${archivo.variable} ${ibmPlexMono.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased font-body bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded focus:font-semibold"
        >
          {skipLabel}
        </a>
        <CapacitorAppUrlListener />
        <AuthSessionProvider>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="light"
            storageKey="nx-theme"
            enableSystem={false}
            disableTransitionOnChange
          >
            <MotionProvider>{children}</MotionProvider>
          </ThemeProvider>
        </AuthSessionProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
