import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Configuration pour Docker
  output: 'standalone',
  
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
    ],
  },
  
};
export default nextConfig;
