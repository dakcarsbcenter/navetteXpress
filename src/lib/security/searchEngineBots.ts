import { promises as dns } from 'dns';

/**
 * Vérifie qu'une IP prétendant être Googlebot/Bingbot l'est réellement, via
 * la méthode officielle de "Forward-Confirmed reverse DNS" (recommandée par
 * Google et Bing) :
 *   1. reverse DNS sur l'IP -> doit donner un hostname du domaine attendu
 *   2. resolve DNS sur ce hostname -> doit redonner l'IP d'origine
 *
 * N'importe qui peut usurper le User-Agent "Googlebot" ; seule cette
 * double vérification DNS confirme l'identité réelle du crawler.
 */

const TRUSTED_BOT_HOST_SUFFIXES = [
    '.googlebot.com',
    '.google.com',
    '.googleusercontent.com', // certains crawlers Google historiques
    '.search.msn.com', // Bingbot
];

interface CacheEntry {
    verified: boolean;
    expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map<string, CacheEntry>();

function looksLikeSearchEngineUA(userAgent: string): boolean {
    const ua = userAgent.toLowerCase();
    return ua.includes('googlebot') || ua.includes('bingbot') || ua.includes('adsbot-google');
}

async function verifyViaFcrDns(ip: string): Promise<boolean> {
    try {
        const hostnames = await dns.reverse(ip);
        const trustedHost = hostnames.find((h) =>
            TRUSTED_BOT_HOST_SUFFIXES.some((suffix) => h.toLowerCase().endsWith(suffix))
        );
        if (!trustedHost) return false;

        const addresses = await dns.resolve4(trustedHost).catch(() => [] as string[]);
        return addresses.includes(ip);
    } catch {
        return false;
    }
}

/**
 * Ne déclenche une résolution DNS (coûteuse) que si le User-Agent revendique
 * déjà être un moteur de recherche connu — sinon retourne false immédiatement.
 * Résultat mis en cache par IP pour éviter de refaire la vérification à
 * chaque requête d'un même crawler.
 */
export async function isVerifiedSearchEngineBot(ip: string, userAgent: string): Promise<boolean> {
    if (ip === 'unknown' || !userAgent || !looksLikeSearchEngineUA(userAgent)) return false;

    const cached = cache.get(ip);
    if (cached && cached.expiresAt > Date.now()) return cached.verified;

    const verified = await verifyViaFcrDns(ip);
    cache.set(ip, { verified, expiresAt: Date.now() + CACHE_TTL_MS });
    return verified;
}
