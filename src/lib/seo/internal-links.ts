// Maillage interne : correspondances entre les contenus geres ailleurs (services
// de la base, segments de tarifs, zones) et les money pages de
// src/lib/seo-money-pages.ts. Un seul endroit a mettre a jour quand une page
// money est ajoutee ou renommee.
import {
    getMoneyRouteBySlug,
    getMoneyServiceBySlug,
    type MoneyPageDefinition,
    type MoneyPageLocale,
} from '@/lib/seo-money-pages';

export interface InternalLink {
    href: string;
    label: string;
}

// Slug d'un service (base de donnees ou lib/services.ts) -> money page. Les
// services sans page dediee (tours-excursions, autres) n'ont pas d'entree : leur
// carte garde le seul lien vers la reservation.
const SERVICE_MONEY_SLUG: Record<string, string> = {
    'transfert-aibd-dakar': 'transfert-aeroport-aibd',
    'transfert-aeroport-aibd': 'transfert-aeroport-aibd',
    'chauffeur-prive': 'chauffeur-prive-dakar',
    'chauffeur-prive-dakar': 'chauffeur-prive-dakar',
    'mise-a-disposition': 'mise-a-disposition-chauffeur',
    'mise-a-disposition-chauffeur': 'mise-a-disposition-chauffeur',
};

export function moneyServicePathForSlug(slug: string): string | null {
    const target = SERVICE_MONEY_SLUG[slug];
    return target ? (getMoneyServiceBySlug(target)?.canonicalPath ?? null) : null;
}

// Segment de tarif -> money page route, d'apres ses points canoniques
// (src/lib/route-nodes.ts). Dakar <-> AIBD a deux pages (une par sens) ; la
// Petite Cote n'a qu'une page par destination, depuis l'AIBD, qui sert aussi le
// trajet retour.
const AIBD_DESTINATION_SLUG: Record<string, string> = {
    SALY: 'aibd-saly',
    SOMONE: 'aibd-somone',
    MBOUR: 'aibd-mbour',
    THIES: 'aibd-thies',
    NGAPAROU: 'aibd-ngaparou',
    NIANING: 'aibd-nianing',
    SAINT_LOUIS: 'aibd-saint-louis',
};

export function moneyRoutePathForNodes(
    departNode: string | null | undefined,
    arriveeNode: string | null | undefined,
): string | null {
    if (!departNode || !arriveeNode) return null;

    let slug: string | undefined;
    if (departNode === 'DAKAR' && arriveeNode === 'AIBD') slug = 'dakar-aibd';
    else if (departNode === 'AIBD' && arriveeNode === 'DAKAR') slug = 'aibd-dakar';
    else if (departNode === 'AIBD') slug = AIBD_DESTINATION_SLUG[arriveeNode];
    else if (arriveeNode === 'AIBD') slug = AIBD_DESTINATION_SLUG[departNode];

    return slug ? (getMoneyRouteBySlug(slug)?.canonicalPath ?? null) : null;
}

// Libelle d'ancre : le H1 de la page cible, dans la langue courante, plutot
// qu'un slug transforme (« Aibd Saly »). L'ancre porte ainsi le mot-cle reel.
export function moneyPageLabel(page: MoneyPageDefinition, locale: string): string {
    return (page.translations[locale as MoneyPageLocale] ?? page.translations.fr).h1;
}

export function moneyPageLink(page: MoneyPageDefinition, locale: string): InternalLink {
    return { href: page.canonicalPath, label: moneyPageLabel(page, locale) };
}

// Pages mises en avant sur l'accueil : le transfert aeroport, les destinations
// de la Petite Cote les plus demandees et les deux services de chauffeur.
const POPULAR_SERVICE_SLUGS = ['transfert-aeroport-aibd', 'chauffeur-prive-dakar', 'mise-a-disposition-chauffeur'];
const POPULAR_ROUTE_SLUGS = ['dakar-aibd', 'aibd-saly', 'aibd-mbour', 'aibd-somone', 'aibd-thies'];

export function popularMoneyLinks(locale: string): InternalLink[] {
    const pages = [
        ...POPULAR_SERVICE_SLUGS.map((slug) => getMoneyServiceBySlug(slug)),
        ...POPULAR_ROUTE_SLUGS.map((slug) => getMoneyRouteBySlug(slug)),
    ].filter((page): page is MoneyPageDefinition => Boolean(page));

    return pages.map((page) => moneyPageLink(page, locale));
}

// Pages proposees depuis une page zone : les zones sont toutes dans Dakar, donc
// le transfert depuis/vers l'AIBD et le chauffeur prive sont les suites
// logiques d'une visite.
const ZONE_SERVICE_SLUGS = ['transfert-aeroport-aibd', 'chauffeur-prive-dakar'];
const ZONE_ROUTE_SLUGS = ['dakar-aibd', 'aibd-dakar'];

export function zoneMoneyLinks(locale: string): InternalLink[] {
    const pages = [
        ...ZONE_SERVICE_SLUGS.map((slug) => getMoneyServiceBySlug(slug)),
        ...ZONE_ROUTE_SLUGS.map((slug) => getMoneyRouteBySlug(slug)),
    ].filter((page): page is MoneyPageDefinition => Boolean(page));

    return pages.map((page) => moneyPageLink(page, locale));
}
