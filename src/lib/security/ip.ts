/**
 * Extraction de l'IP cliente derrière le reverse proxy Caddy.
 * Caddy renseigne automatiquement X-Forwarded-For sur `reverse_proxy`.
 */
export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // "client, proxy1, proxy2" -> le premier est le client d'origine
        const first = forwardedFor.split(',')[0]?.trim();
        if (first) return first;
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    return 'unknown';
}
