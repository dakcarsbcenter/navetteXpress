import type { Metadata, Viewport } from "next";
import "./globals.css";

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


/**
 * Layout racine en simple passe-plat (modèle next-intl) : le document HTML est
 * rendu par chaque layout de premier niveau via RootShell
 * (src/components/layout/RootShell.tsx). Ici, plus aucun appel à getLocale() :
 * il rendait toutes les pages publiques dynamiques.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
