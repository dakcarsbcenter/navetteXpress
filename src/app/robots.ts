import { MetadataRoute } from 'next';

// Crawlers de scraping/SEO agressif connus pour aspirer contenu, tarifs et
// disponibilités sans valeur d'échange (pas de trafic de recherche généré
// pour navettexpress.com) — on les bloque explicitement du site entier.
const AGGRESSIVE_SCRAPER_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'DataForSeoBot',
  'PetalBot',
];

const COMMON_DISALLOW = [
  '/admin/',
  '/driver/',
  '/client/',
  '/api/',
  '/auth/',
  '/_next/',
  '/palette',
  '/iconographie',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://navettexpress.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      // Autorisation explicite des moteurs de recherche légitimes (SEO
      // prioritaire pour l'acquisition) : mêmes règles que le groupe '*',
      // listées séparément pour que l'intention soit sans ambiguïté.
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      ...AGGRESSIVE_SCRAPER_BOTS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
