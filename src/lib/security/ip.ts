/**
 * Extraction de l'IP cliente derrière Cloudflare puis le reverse proxy Caddy.
 * Cloudflare renseigne `CF-Connecting-IP` ; Caddy le supprime si la requête
 * ne vient pas d'une plage Cloudflare (voir Caddyfile), donc il n'est pas usurpable.
 * Sans Cloudflare (dev local), on retombe sur X-Forwarded-For renseigné par Caddy.
 */
export function getClientIp(request: Request): string {
    const cfIp = request.headers.get('cf-connecting-ip')?.trim();
    if (cfIp) return cfIp;

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
