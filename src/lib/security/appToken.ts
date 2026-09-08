import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logSecurityEvent } from './logger';
import { getClientIp } from './ip';

let warnedMissingToken = false;

/**
 * Garde légère pour les routes API publiques exposant des données
 * commerciales sensibles (tarifs, lieux, véhicules) : ce n'est PAS une
 * authentification utilisateur, juste un frein contre les appels directs
 * depuis un script externe (curl/Postman/scraper basique) qui n'a pas
 * chargé le site ni son bundle JS.
 *
 * Passe si :
 *  - une session NextAuth valide existe (back-office, dashboard), OU
 *  - le header x-app-token correspond au token applicatif partagé.
 */
export async function isAuthorizedPublicApiCall(request: Request): Promise<boolean> {
    const session = await getServerSession(authOptions).catch(() => null);
    if (session?.user) return true;

    const expectedToken = process.env.APP_API_TOKEN;

    // Si APP_API_TOKEN n'est pas configuré (oubli de déploiement, environnement
    // local sans .env dédié), on n'ajoute pas de friction sur le parcours de
    // réservation : la garde reste inactive plutôt que de bloquer tous les
    // visiteurs anonymes. On le signale une fois pour que ce soit visible en
    // recette/QA et corrigé avant la mise en prod définitive.
    if (!expectedToken) {
        if (!warnedMissingToken) {
            warnedMissingToken = true;
            logSecurityEvent('public_api_rejected', {
                reason: 'APP_API_TOKEN non configuré — garde anti-scraping inactive',
                path: new URL(request.url).pathname,
            });
        }
        return true;
    }

    const providedToken = request.headers.get('x-app-token');
    if (providedToken === expectedToken) return true;

    logSecurityEvent('public_api_rejected', {
        ip: getClientIp(request),
        path: new URL(request.url).pathname,
        userAgent: request.headers.get('user-agent'),
        hadToken: Boolean(providedToken),
    });

    return false;
}
