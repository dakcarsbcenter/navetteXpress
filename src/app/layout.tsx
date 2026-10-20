import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { GoogleAnalytics } from "./google-analytics";
import { CapacitorAppUrlListener } from '@/components/mobile/CapacitorAppUrlListener';
import { getLocale, getTranslations } from 'next-intl/server';

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1F5245',
};

export const metadata: Metadata = {
  // ── Identité de base ──
  metadataBase: new URL('https://navettexpress.com'),
  title: {
    default: 'Navette Xpress | Chauffeur Privé Dakar & Transfert Aéroport AIBD',
    // Pass-through volontaire : chaque page porte déjà la marque dans son
    // propre titre (messages/<locale>/*.json et seo-money-pages.ts). Un
    // suffixe ici produisait des titres de 94 à 121 caractères, tronqués par
    // Google et dupliquant « Navette Xpress » deux fois dans le SERP.
    template: '%s',
  },
  description:
    'Service de chauffeur privé à Dakar. Transfert aéroport AIBD 24h/24, navette privée, mise à disposition. Réservation en ligne, prix fixe. +221 78 465 13 02',

  // ── Mots-clés ──
  keywords: [
    'chauffeur privé Dakar',
    'transfert aéroport AIBD',
    'navette Dakar aéroport',
    'VTC Dakar',
    'taxi privé Dakar',
    'transport privé Sénégal',
    'navette AIBD',
    'chauffeur professionnel Dakar',
    'transfert Dakar AIBD',
    'private driver Dakar',
    'airport transfer Dakar',
    'AIBD airport transfer',
    'chauffeur Dakar 24h',
    'réservation navette Dakar',
  ],

  // ── Auteur & Publisher ──
  authors: [{ name: 'Navette Xpress', url: 'https://navettexpress.com' }],
  creator: 'Navette Xpress',
  publisher: 'Navette Xpress',

  // ── Open Graph ──
  // Ni `url` ni `images` ici : l'URL doit suivre le canonical de chaque page
  // (une valeur fixe donnait l'accueil comme og:url partout), et l'image vient du
  // fichier conventionnel src/app/[locale]/opengraph-image.tsx.
  openGraph: {
    type: 'website',
    siteName: 'Navette Xpress',
    title: 'Navette Xpress — Chauffeur Privé à Dakar',
    description:
      'Transfert aéroport AIBD, navette privée & chauffeur dédié à Dakar. Disponible 24h/24, prix fixe, confirmation immédiate.',
  },

  // ── Twitter / X Card ──
  twitter: {
    card: 'summary_large_image',
    title: 'Navette Xpress — Chauffeur Privé Dakar',
    description: 'Transfert AIBD, navette privée & chauffeur dédié à Dakar. 24h/24, prix fixe.',
    creator: '@navettexpress',
  },

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Verification ──
  verification: {
    google: '5nOkgRfUJmawd60vAqApGz-swJ-Z44cyF8-_D844i4w',
  },

  // Pas de `alternates` ici : canonical et hreflang sont propres a chaque page
  // (buildAlternates). Un canonical fixe sur la racine pointait vers l'accueil
  // pour toute page sans metadonnees (404, espaces connectes).

  // ── Icônes ──
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },

  // ── Manifest PWA ──
  manifest: '/manifest.webmanifest',
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = await getTranslations('Navigation');
  return (
    <html lang={locale} suppressHydrationWarning className={`scroll-smooth ${archivo.variable} ${ibmPlexMono.variable}`} data-scroll-behavior="smooth">
      <head />
      <body className="antialiased font-body bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded focus:font-semibold"
        >
          {t('skipToContent')}
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
