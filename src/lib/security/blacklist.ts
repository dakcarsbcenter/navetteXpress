/**
 * Liste noire en mémoire (process du VPS). Une IP qui déclenche le honeypot
 * reçoit un 403 sur toutes ses requêtes suivantes pendant `DEFAULT_BAN_MS`.
 *
 * Volontairement simple (Map en mémoire, pas Redis) : un seul process Node
 * tourne sur le VPS. Elle est réinitialisée à chaque redémarrage/redeploy du
 * conteneur — acceptable pour ce cas d'usage (dissuasion, pas une liste de
 * sécurité critique). À migrer vers Redis si l'app est un jour scalée
 * horizontalement (plusieurs instances derrière le reverse proxy).
 */

const DEFAULT_BAN_MS = 24 * 60 * 60 * 1000; // 24h

const blacklist = new Map<string, number>(); // ip -> timestamp d'expiration

function sweepExpired() {
    const now = Date.now();
    for (const [ip, expiresAt] of blacklist) {
        if (expiresAt <= now) blacklist.delete(ip);
    }
}

export function isBlacklisted(ip: string): boolean {
    if (ip === 'unknown') return false;
    const expiresAt = blacklist.get(ip);
    if (!expiresAt) return false;
    if (expiresAt <= Date.now()) {
        blacklist.delete(ip);
        return false;
    }
    return true;
}

export function addToBlacklist(ip: string, durationMs: number = DEFAULT_BAN_MS) {
    if (ip === 'unknown') return;
    blacklist.set(ip, Date.now() + durationMs);
    // Petit ménage opportuniste pour éviter une croissance illimitée de la Map
    if (blacklist.size % 50 === 0) sweepExpired();
}
