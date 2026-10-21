import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const cspReportOnly = [
  "default-src 'self'",
  // 'unsafe-inline' : scripts JSON-LD et gtag inline ; 'unsafe-eval' : HMR en dev.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"} https://www.googletagmanager.com`,
  // framer-motion et les composants écrivent des styles inline.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://storage.googleapis.com https://media.autoexpress.co.uk https://*.unsplash.com https://*.tile.openstreetmap.org https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  // accounts.google.com : le formulaire de connexion Google redirige vers Google apres le POST.
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {

  // Autoriser l'acces aux ressources de dev (HMR) depuis les hosts locaux/docker
  allowedDevOrigins: ['172.21.0.1', 'localhost', '127.0.0.1'],

  // Configuration pour Docker
  output: 'standalone',

  // next-intl charge les fichiers de messages via un import() dynamique
  // (chemin construit à partir de la locale) : le traceur de fichiers de
  // Next.js ne le détecte pas automatiquement pour le build "standalone",
  // ce qui exclurait silencieusement messages/ de l'image Docker. On force
  // son inclusion explicitement.
  outputFileTracingIncludes: {
    '/**': ['./messages/**'],
  },

  // Optimisations SEO
  compress: true,
  poweredByHeader: false,

  // Evite d'embarquer des barrel files entiers (icones, UI, animations)
  // dans le bundle client quand seules quelques exports sont utilisees
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', '@headlessui/react', 'framer-motion'],
  },

  // Redirections pour SEO
  async redirects() {
    return [
      {
        source: '/transfert-aeroport',
        destination: '/services/transfert-aeroport-aibd',
        permanent: true,
      },
      {
        source: '/navette-aeroport',
        destination: '/services/transfert-aeroport-aibd',
        permanent: true,
      },
      {
        source: '/navette-aeroport-aibd',
        destination: '/services/transfert-aeroport-aibd',
        permanent: true,
      },
      {
        source: '/chauffeur-prive-dakar',
        destination: '/services/chauffeur-prive-dakar',
        permanent: true,
      },
      {
        source: '/trajet/aibd-vers-dakar',
        destination: '/routes/aibd-dakar',
        permanent: true,
      },
      {
        source: '/trajet/aibd-vers-saly',
        destination: '/routes/aibd-saly',
        permanent: true,
      },
      {
        source: '/trajet/aibd-vers-ngaparou',
        destination: '/routes/aibd-ngaparou',
        permanent: true,
      },
      {
        source: '/trajet/aibd-vers-nianing',
        destination: '/routes/aibd-nianing',
        permanent: true,
      },
      {
        source: '/trajet/dakar-vers-aibd',
        destination: '/routes/dakar-aibd',
        permanent: true,
      },
      {
        source: '/tarifs-transferts-aibd',
        destination: '/services/transfert-aeroport-aibd',
        permanent: true,
      },
      {
        source: '/service/transfert-business-dakar',
        destination: '/services/chauffeur-affaires-dakar',
        permanent: true,
      },
      {
        source: '/service/transfert-famille-vip',
        destination: '/services/transfert-famille-dakar',
        permanent: true,
      },
      // La page a perdu « VIP » dans son slug : l'ancienne URL (et ses versions
      // en/es) pointe vers la nouvelle, sans passer par un 404.
      {
        source: '/services/transfert-famille-vip-dakar',
        destination: '/services/transfert-famille-dakar',
        permanent: true,
      },
      {
        source: '/:locale(en|es)/services/transfert-famille-vip-dakar',
        destination: '/:locale/services/transfert-famille-dakar',
        permanent: true,
      },
      {
        source: '/guide/taxi-vs-transfert-prive-dakar',
        destination: '/faq',
        permanent: true,
      },
      {
        source: '/en/airport-transfer-dakar-aibd',
        destination: '/en/services/transfert-aeroport-aibd',
        permanent: true,
      },
    ];
  },

  // Headers pour la sécurité et les performances
  async headers() {
    return [
      // Espaces connectes : proteges par authentification, mais sans noindex un
      // lien partage ou une redirection pourrait les faire remonter dans Google.
      // En-tete HTTP plutot que metadata : ces layouts sont des composants client.
      {
        source: '/(admin|driver|client|entreprise)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/(dashboard|my-quotes)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Le site n'utilise ni micro, ni géolocalisation, ni paiement
          // navigateur : on les coupe. La caméra reste permise à l'origine
          // (champs de fichier avec capture photo, ex. candidature chauffeur).
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Report-Only : les violations apparaissent dans la console sans rien
          // bloquer. À passer en 'Content-Security-Policy' une fois la liste
          // validée sur quelques jours de trafic réel (GA, Leaflet, Cloudinary).
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspReportOnly,
          },
        ],
      },
    ];
  },

  // Images optimisées - Configuration minimale (toutes images migrées vers Cloudinary)
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // 🏠 CLOUDINARY - Domaine principal pour toutes les images
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // � GOOGLE - Avatars pour l'authentification Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // 📦 LEGACY - Google Cloud Storage (si nécessaire)
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/clicars-storage-prod-public/**',
      },
      // 🚗 EXTERNAL - Images de véhicules externes (temporaire)
      {
        protocol: 'https',
        hostname: 'media.autoexpress.co.uk',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
  },

};
export default withNextIntl(nextConfig);
