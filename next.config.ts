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
  
  // Images optimisées
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/clicars-storage-prod-public/**',
      },
      // Cloudinary - pour les images uploadées (RECOMMANDÉ)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Images temporaires - À REMPLACER par Cloudinary
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'media.autoexpress.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'www.topgear.com',
      },
      {
        protocol: 'http',
        hostname: 'www.topgear.com',
      },
      // Autres domaines courants d'images
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'mkt-vehicleimages-prd.autotradercdn.ca',
      },
      {
        protocol: 'https',
        hostname: 'images.hgmsites.net',
      },
      {
        protocol: 'https',
        hostname: 'platform.cstatic-images.com',
      },
      // Common car image domains
      {
        protocol: 'https',
        hostname: 'www.cstatic-images.com',
      },
      {
        protocol: 'https',
        hostname: 'hips.hearstapps.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.motor1.com',
      },
      {
        protocol: 'https',
        hostname: 'imgd.aeplcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'www.edmunds.com',
      },
      {
        protocol: 'https',
        hostname: 'edmunds.com',
      },
      {
        protocol: 'https',
        hostname: 'www.carlogos.org',
      },
      {
        protocol: 'https',
        hostname: 'www.cars.com',
      },
      {
        protocol: 'https',
        hostname: 'cars.com',
      },
      {
        protocol: 'https',
        hostname: 'www.caranddriver.com',
      },
      {
        protocol: 'https',
        hostname: 'www.motortrend.com',
      },
      {
        protocol: 'https',
        hostname: 'www.netcarshow.com',
      },
      {
        protocol: 'https',
        hostname: 'vehicle-images.dealerinspire.com',
      },
      // Autres domaines d'images de véhicules
      {
        protocol: 'https',
        hostname: 'www.auto-data.net',
      },
      {
        protocol: 'https',
        hostname: 'www.carpixel.net',
      },
      {
        protocol: 'https',
        hostname: 'static.cargurus.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.newcars.com',
      },
      // Domaines des constructeurs automobiles
      {
        protocol: 'https',
        hostname: 'buildfoc.ford.com',
      },
      {
        protocol: 'https',
        hostname: 'www.ford.com',
      },
      {
        protocol: 'https',
        hostname: 'media.ford.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mercedes-benz.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.mbusa.com',
      },
      {
        protocol: 'https',
        hostname: 'www.bmw.com',
      },
      {
        protocol: 'https',
        hostname: 'prod.cosy.bmw.cloud',
      },
      {
        protocol: 'https',
        hostname: 'www.audi.com',
      },
      {
        protocol: 'https',
        hostname: 'mediaservice.audi.com',
      },
      {
        protocol: 'https',
        hostname: 'www.toyota.com',
      },
      {
        protocol: 'https',
        hostname: 'www.peugeot.com',
      },
      {
        protocol: 'https',
        hostname: 'www.renault.fr',
      },
      {
        protocol: 'https',
        hostname: 'www.citroen.com',
      },
      {
        protocol: 'https',
        hostname: 'www.volkswagen.com',
      },
      // Domaines d'images d'inventaire automobile
      {
        protocol: 'https',
        hostname: 'inventory-dmg.assets-cdk.com',
      },
      {
        protocol: 'https',
        hostname: 'www.auto123.com',
      },
      {
        protocol: 'https',
        hostname: 'static.tcimg.net',
      },
      {
        protocol: 'https',
        hostname: 'www.automobilesreview.com',
      },
      {
        protocol: 'https',
        hostname: 'www.autocar.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'cdn.carbuzz.com',
      },
      {
        protocol: 'https',
        hostname: 'www.autoweek.com',
      },
    ],
  },
  
};
export default nextConfig;
