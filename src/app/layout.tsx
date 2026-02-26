import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { GoogleAnalytics } from "./google-analytics";
import { JsonLd } from '@/components/seo/JsonLd';
import { schemaLocalBusiness, schemaWebSite } from '@/lib/schema';

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C9A84C',
};

export const metadata: Metadata = {
  // ── Identité de base ──
  metadataBase: new URL('https://navettexpress.com'),
  title: {
    default: 'Navette Xpress | Chauffeur Privé Dakar & Transfert Aéroport AIBD',
    template: '%s | Navette Xpress — Chauffeur Privé Dakar',
  },
  description:
    'Service de chauffeur privé N°1 à Dakar. Transfert aéroport AIBD 24h/24, navette privée, mise à disposition. Réservation en ligne, prix fixe, chauffeurs certifiés. +221 78 131 91 91',

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
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    alternateLocale: ['fr_FR', 'en_US'],
    url: 'https://navettexpress.com',
    siteName: 'Navette Xpress',
    title: 'Navette Xpress — Chauffeur Privé Premium à Dakar',
    description:
      'Transfert aéroport AIBD, navette privée & chauffeur dédié à Dakar. Disponible 24h/24, prix fixe, confirmation immédiate.',
    images: [
      {
        url: '/og/og-default.jpg',   // 1200×630px
        width: 1200,
        height: 630,
        alt: 'Navette Xpress — Service de chauffeur privé à Dakar',
      },
    ],
  },

  // ── Twitter / X Card ──
  twitter: {
    card: 'summary_large_image',
    title: 'Navette Xpress — Chauffeur Privé Dakar',
    description: 'Transfert AIBD, navette privée & chauffeur dédié à Dakar. 24h/24, prix fixe.',
    images: ['/og/og-default.jpg'],
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
  // verification: {
  //   google: 'GOOGLE_SEARCH_CONSOLE_CODE',
  //   other: { 'msvalidate.01': 'BING_CODE' },
  // },

  // ── Canonique ──
  alternates: {
    canonical: 'https://navettexpress.com',
    languages: {
      'fr-SN': 'https://navettexpress.com',
      'fr-FR': 'https://navettexpress.com',
      'en-US': 'https://navettexpress.com/en',
    },
  },

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
  manifest: '/manifest.json',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="scroll-smooth">
      <head />
      <body className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} antialiased font-body bg-background text-foreground`}>
        <JsonLd data={schemaLocalBusiness} />
        <JsonLd data={schemaWebSite} />
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthSessionProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
