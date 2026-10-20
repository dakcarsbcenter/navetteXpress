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

// Pas de lastModified, changeFrequency ni priority : Google ignore les deux
// derniers, et un lastmod = new Date() (la date de chaque requete) lui apprend
// a ignorer aussi lastmod sur tout le site. /reservation et /quote-request sont
// des formulaires sans valeur de recherche (noindex), donc absents d'ici.
const staticRoutes: string[] = [
  '/',
  '/services',
  '/routes',
  '/flotte',
  '/contact',
  '/faq',
  // Page de recrutement chauffeurs : annonce JobPosting active.
  '/devenir-partenaire',
  '/entreprises',
  '/diaspora',
  '/tarifs',
  '/cgv',
  '/mentions-legales',
  '/confidentialite',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const add = (path: string, locale: string) =>
    entries.push({
      url: localizedUrl(path, locale),
      alternates: { languages: buildAlternates(path, locale).languages },
    });

  for (const locale of routing.locales) {
    for (const path of staticRoutes) {
      add(path, locale);
    }

    // Liste importee de la source unique partagee avec la page /zones/[zone] :
    // le tableau local qui vivait ici avait derive et soumettait a Google cinq
    // zones sans page (saly, saint-louis, mbour, lac-rose, somone), donc cinq
    // 404 indexables. Ces destinations sont couvertes par les money pages
    // /routes/aibd-*, deja listees plus bas via allMoneyPages.
    for (const zone of zoneSlugs) {
      add(`/zones/${zone}`, locale);
    }

    for (const page of allMoneyPages) {
      add(page.canonicalPath, locale);
    }
  }

  return entries;
}
