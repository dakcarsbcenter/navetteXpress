import { MetadataRoute } from 'next';
import { allMoneyPages } from '@/lib/seo-money-pages';
import { routing } from '@/i18n/routing';
import { buildAlternates } from '@/lib/seo/localized-metadata';
import { zoneSlugs } from '@/lib/seo/zone-slugs';

const baseUrl = 'https://navettexpress.com';

function localizedUrl(path: string, locale: string) {
  const cleanPath = path === '/' ? '' : path;
  return locale === routing.defaultLocale ? `${baseUrl}${cleanPath}` : `${baseUrl}/${locale}${cleanPath}`;
}

interface StaticRoute {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}

const staticRoutes: StaticRoute[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/services', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/routes', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/flotte', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/reservation', changeFrequency: 'daily', priority: 0.5 },
  { path: '/faq', changeFrequency: 'weekly', priority: 0.7 },
  // Page de recrutement chauffeurs : c'est une annonce JobPosting active, donc
  // un crawl frequent et une priorite haute — l'acquisition de partenaires est
  // au meme niveau que l'acquisition de clients.
  { path: '/devenir-partenaire', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/entreprises', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/diaspora', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/tarifs', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/quote-request', changeFrequency: 'monthly', priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: localizedUrl(route.path, locale),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: buildAlternates(route.path, locale).languages },
      });
    }

    // Liste importee de la source unique partagee avec la page /zones/[zone] :
    // le tableau local qui vivait ici avait derive et soumettait a Google cinq
    // zones sans page (saly, saint-louis, mbour, lac-rose, somone), donc cinq
    // 404 indexables. Ces destinations sont couvertes par les money pages
    // /routes/aibd-*, deja listees plus bas via allMoneyPages.
    for (const zone of zoneSlugs) {
      const zonePath = `/zones/${zone}`;
      entries.push({
        url: localizedUrl(zonePath, locale),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: buildAlternates(zonePath, locale).languages },
      });
    }

    for (const page of allMoneyPages) {
      entries.push({
        url: localizedUrl(page.canonicalPath, locale),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
        alternates: { languages: buildAlternates(page.canonicalPath, locale).languages },
      });
    }
  }

  return entries;
}
