import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { GoogleAnalytics } from "./google-analytics";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Navette Xpress - Transfert Aéroport Dakar AIBD | Chauffeur Privé Sénégal",
  description: "Service de transfert aéroport AIBD Dakar, Thies, Mbour. Chauffeurs privés professionnels 24h/24. Réservation instantanée, véhicules de luxe, prix compétitifs.",
  keywords: "transfert aéroport Dakar, navette AIBD, chauffeur privé Sénégal, transport privé Dakar, transfert aéroport Thies, transfert aéroport Mbour, service chauffeur 24h Dakar",
  authors: [{ name: "Navette Xpress Sénégal" }],
  creator: "Navette Xpress",
  publisher: "Navette Xpress Sénégal",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://navettexpress.sn'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-SN': '/',
      'en-SN': '/en',
    },
  },
  openGraph: {
    title: "Navette Xpress - Transfert Aéroport Dakar AIBD | Chauffeur Privé Sénégal",
    description: "Service de transfert aéroport AIBD Dakar, Thies, Mbour. Chauffeurs privés professionnels 24h/24. Réservation instantanée, véhicules de luxe.",
    url: 'https://navettexpress.sn',
    siteName: 'Navette Xpress Sénégal',
    images: [
      {
        url: '/og-image-navette-xpress.jpg',
        width: 1200,
        height: 630,
        alt: 'Navette Xpress - Service de Transfert Aéroport Dakar AIBD',
      },
    ],
    locale: 'fr_SN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Navette Xpress - Transfert Aéroport Dakar AIBD",
    description: "Service de transfert aéroport AIBD Dakar, Thies, Mbour. Chauffeurs privés professionnels 24h/24.",
    images: ['/og-image-navette-xpress.jpg'],
  },
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "TransportationService",
    "name": "Navette Xpress Sénégal",
    "description": "Service de transfert aéroport AIBD Dakar, Thies, Mbour. Chauffeurs privés professionnels 24h/24 pour tous vos déplacements au Sénégal.",
    "url": "https://navettexpress.sn",
    "telephone": "+221781319191",
    "email": "contact@navettexpress.sn",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Avenue Léopold Sédar Senghor",
      "addressLocality": "Dakar",
      "addressRegion": "Dakar",
      "addressCountry": "SN",
      "postalCode": "10000"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "14.6928",
      "longitude": "-17.4467"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Dakar",
        "containedInPlace": {
          "@type": "Country",
          "name": "Sénégal"
        }
      },
      {
        "@type": "City", 
        "name": "Thiès",
        "containedInPlace": {
          "@type": "Country",
          "name": "Sénégal"
        }
      },
      {
        "@type": "City",
        "name": "Mbour", 
        "containedInPlace": {
          "@type": "Country",
          "name": "Sénégal"
        }
      }
    ],
    "serviceType": [
      "Transfert Aéroport",
      "Transport Privé",
      "Chauffeur Privé",
      "Navette Aéroport"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services de Transport",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Transfert Aéroport AIBD Dakar",
            "description": "Service de transfert vers et depuis l'aéroport AIBD de Dakar"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Transfert Aéroport Thies",
            "description": "Service de transfert vers et depuis l'aéroport de Thies"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Transfert Aéroport Mbour",
            "description": "Service de transfert vers et depuis l'aéroport de Mbour"
          }
        }
      ]
    },
    "openingHours": "Mo-Su 00:00-23:59",
    "priceRange": "$$",
    "foundingDate": "2024",
    "sameAs": [
      "https://www.facebook.com/navettexpresssenegal",
      "https://www.instagram.com/navettexpresssenegal"
    ]
  };

  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaOrg),
          }}
        />
      </head>
      <body
        className={`${poppins.variable} antialiased font-sans`}
      >
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
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
