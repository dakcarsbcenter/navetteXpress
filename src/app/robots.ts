import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://navettexpress.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/driver/',
          '/client/',
          '/api/',
          '/auth/',
          '/_next/',
          '/palette',
          '/iconographie',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
