import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { GoogleAnalytics } from "./google-analytics";

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

export const metadata: Metadata = {
  title: "Navette Xpress | Chauffeur Privé Dakar & Transfert Aéroport AIBD",
  description: "Service de chauffeur privé N°1 à Dakar. Transfert aéroport AIBD, navette Dakar, mise à disposition. Réservation instantanée, prix fixes, disponible 24h/24. +221 78 131 91 91",
  keywords: "chauffeur privé Dakar, transfert aéroport AIBD, navette Dakar aéroport, VTC Dakar, chauffeur Dakar, transport privé Sénégal, navette AIBD, taxi privé Dakar, chauffeur professionnel Dakar",
  authors: [{ name: "Navette Xpress" }],
  openGraph: {
    title: "Navette Xpress — Chauffeur Privé Premium à Dakar",
    description: "Transferts AIBD, navettes et mise à disposition avec chauffeurs professionnels certifiés. Disponible 24h/24 à Dakar.",
    url: 'https://navettexpress.com',
    siteName: 'Navette Xpress',
    images: [
      {
        url: '/og-image-navette-xpress.jpg',
        width: 1200,
        height: 630,
        alt: 'Navette Xpress — Chauffeur Privé Premium à Dakar',
      },
    ],
    locale: 'fr_SN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Navette Xpress — Chauffeur Privé Premium à Dakar",
    description: "Transferts AIBD, navettes et mise à disposition avec chauffeurs professionnels certifiés.",
    images: ['/og-image-navette-xpress.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Navette Xpress",
    "description": "Service de chauffeur privé et transfert aéroport AIBD à Dakar, Sénégal",
    "@id": "https://navettexpress.com",
    "url": "https://navettexpress.com",
    "telephone": "+221781319191",
    "email": "contact@navettexpress.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Dakar",
      "addressLocality": "Dakar",
      "addressCountry": "SN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 14.7167,
      "longitude": -17.4677
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "priceRange": "$$",
    "image": "https://navettexpress.com/og-image-navette-xpress.jpg",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127"
    },
    "sameAs": [
      "https://www.facebook.com/navettexpresssenegal",
      "https://www.instagram.com/navettexpresssenegal"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Chauffeur privé et transfert aéroport",
    "provider": { "@type": "LocalBusiness", "name": "Navette Xpress" },
    "areaServed": {
      "@type": "City",
      "name": "Dakar",
      "containedIn": { "@type": "Country", "name": "Sénégal" }
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "XOF",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <html lang="fr" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceSchema),
          }}
        />
      </head>
      <body className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} antialiased font-body bg-background text-foreground`}>
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
