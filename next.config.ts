import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {

  // Fixe la racine du workspace pour éviter le warning de lockfiles multiples (worktrees git)
  outputFileTracingRoot: path.resolve(__dirname),

  // Autoriser l'acces aux ressources de dev (HMR) depuis les hosts locaux/docker
  allowedDevOrigins: ['172.21.0.1', 'localhost', '127.0.0.1'],

  // Configuration pour Docker
  output: 'standalone',

  // Désactiver TypeScript checks pendant le build (pour Coolify)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimisations SEO
  compress: true,
  poweredByHeader: false,

  // Redirections pour SEO
  async redirects() {
    return [
      {
        source: '/transfert-aeroport',
        destination: '/transfert-aeroport-dakar',
        permanent: true,
      },
      {
        source: '/navette-aeroport',
        destination: '/transfert-aeroport-dakar',
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
        destination: '/services/transfert-famille-vip-dakar',
        permanent: true,
      },
      {
        source: '/guide/taxi-vs-transfert-prive-dakar',
        destination: '/faq',
        permanent: true,
      },
      {
        source: '/en/airport-transfer-dakar-aibd',
        destination: '/en',
        permanent: true,
      },
    ];
  },

  // Headers pour la sécurité et les performances
  async headers() {
    return [
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
export default nextConfig;
