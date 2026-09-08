/**
 * Wrapper de fetch pour les routes API publiques protégées par un token
 * applicatif léger (voir src/lib/security/appToken.ts). Le token est un
 * NEXT_PUBLIC_* (donc visible dans le bundle JS) : il ne remplace pas une
 * vraie authentification, il sert uniquement à filtrer les appels directs
 * de scripts externes qui n'ont jamais chargé la page.
 */
export function fetchPublicApi(input: string, init: RequestInit = {}): Promise<Response> {
    const token = process.env.NEXT_PUBLIC_APP_API_TOKEN;
    const headers = new Headers(init.headers);
    if (token) headers.set('x-app-token', token);
    return fetch(input, { ...init, headers });
}
